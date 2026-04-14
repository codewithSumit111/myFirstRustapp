extern crate alloc;

// Modules and imports
mod erc721;

use alloc::string::String;
use alloc::vec::Vec;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{
    abi::Bytes,
    call::Call,
    contract,
    msg,
    block,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};

// Interfaces for the Art contract and the ERC20 contract
sol_interface! {
    interface NftArt {
        function initialize(address token_contract_address) external;
        function generateArt(uint256 token_id, address owner) external returns(string);
    }
}

struct EventTicketNFTParams;

/// Immutable definitions
impl Erc721Params for EventTicketNFTParams {
    const NAME: &'static str = "EventTicketNFT";
    const SYMBOL: &'static str = "ETNFT";
}

/// Ticket struct to store event information
#[derive(Clone)]
pub struct Ticket {
    pub event_id: U256,
    pub event_name: String,
    pub event_date: String,
    pub seat_info: String,
    pub is_used: bool,
    pub used_at: U256,
}

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct EventTicketNFT {
        address art_contract_address;

        /// Mapping from token ID to ticket data
        mapping(uint256 => TicketData) tickets;

        /// Mapping from event ID to price
        mapping(uint256 => uint256) event_prices;

        /// Authorized verifiers (event staff)
        mapping(address => bool) verifiers;

        /// Tracks whether an address already holds a ticket (1 per wallet)
        mapping(address => bool) has_ticket;

        /// Contract owner
        address owner;

        /// Track total global checked-in tickets
        uint256 total_used;

        #[borrow] // Allows erc721 to access MyToken's storage and make calls
        Erc721<EventTicketNFTParams> erc721;
    }
}

/// Storage structure for ticket data
sol_storage! {
    struct TicketData {
        uint256 event_id;
        bytes event_name;
        bytes event_date;
        bytes seat_info;
        bool is_used;
        uint256 used_at;
        address original_owner;
    }
}

// Declare Solidity error types
sol! {
    /// Contract has already been initialized
    error AlreadyInitialized();
    /// A call to an external contract failed
    error ExternalCallFailed();
    /// Ticket has already been used
    error TicketAlreadyUsed(uint256 token_id);
    /// Not authorized to verify tickets
    error NotAuthorized();
    /// Invalid event ID
    error InvalidEventId(uint256 event_id);
    /// Ticket does not exist
    error TicketNotFound(uint256 token_id);
    /// Not the ticket owner
    error NotTicketOwner(uint256 token_id);
    /// Wallet already holds a ticket (limit: 1 per wallet)
    error AlreadyHasTicket(address wallet);
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum EventTicketNFTError {
    AlreadyInitialized(AlreadyInitialized),
    ExternalCallFailed(ExternalCallFailed),
    TicketAlreadyUsed(TicketAlreadyUsed),
    NotAuthorized(NotAuthorized),
    InvalidEventId(InvalidEventId),
    TicketNotFound(TicketNotFound),
    NotTicketOwner(NotTicketOwner),
    AlreadyHasTicket(AlreadyHasTicket),
}

#[public]
#[inherit(Erc721<EventTicketNFTParams>)]
impl EventTicketNFT {
    /// Initialize the contract with the deployer as owner
    pub fn initialize(&mut self) -> Result<(), EventTicketNFTError> {
        if !self.owner.get().is_zero() {
            return Err(EventTicketNFTError::AlreadyInitialized(AlreadyInitialized {}));
        }
        self.owner.set(msg::sender());
        Ok(())
    }

    /// Set event price (only owner)
    pub fn set_event_price(&mut self, event_id: U256, price: U256) -> Result<(), EventTicketNFTError> {
        self.require_owner()?;
        self.event_prices.insert(event_id, price);
        Ok(())
    }

    /// Add/remove verifier (only owner)
    pub fn set_verifier(&mut self, verifier: Address, authorized: bool) -> Result<(), EventTicketNFTError> {
        self.require_owner()?;
        self.verifiers.insert(verifier, authorized);
        Ok(())
    }

    /// Mint a ticket with event data
    pub fn mint_ticket(
        &mut self,
        to: Address,
        event_id: U256,
        event_name: Bytes,
        event_date: Bytes,
        seat_info: Bytes,
    ) -> Result<U256, EventTicketNFTError> {
        // Enforce 1-ticket-per-wallet limit
        if self.has_ticket.get(to) {
            return Err(EventTicketNFTError::AlreadyHasTicket(AlreadyHasTicket { wallet: to }));
        }

        // Get the new token ID before minting
        let token_id = self.erc721.total_supply.get();
        
        // Mint the NFT
        self.erc721.mint(to).map_err(|e| EventTicketNFTError::ExternalCallFailed(ExternalCallFailed {}))?;

        // Mark wallet as having a ticket
        self.has_ticket.insert(to, true);
        
        // Store ticket data
        let mut ticket = self.tickets.setter(token_id);
        ticket.event_id.set(event_id);
        ticket.event_name.set_bytes(&event_name.0);
        ticket.event_date.set_bytes(&event_date.0);
        ticket.seat_info.set_bytes(&seat_info.0);
        ticket.is_used.set(false);
        ticket.used_at.set(U256::from(0));
        ticket.original_owner.set(to);
        
        Ok(token_id)
    }

    /// Get ticket information
    pub fn get_ticket_info(&self, token_id: U256) -> Result<(U256, Bytes, Bytes, Bytes, bool, U256, Address), EventTicketNFTError> {
        let ticket = self.tickets.get(token_id);
        
        // Check if ticket exists by checking if original_owner is not zero
        if ticket.original_owner.get().is_zero() {
            return Err(EventTicketNFTError::TicketNotFound(TicketNotFound { token_id }));
        }
        
        Ok((
            ticket.event_id.get(),
            Bytes(ticket.event_name.get_bytes()),
            Bytes(ticket.event_date.get_bytes()),
            Bytes(ticket.seat_info.get_bytes()),
            ticket.is_used.get(),
            ticket.used_at.get(),
            ticket.original_owner.get(),
        ))
    }

    /// Mark ticket as used (only authorized verifiers)
    pub fn mark_ticket_used(&mut self, token_id: U256) -> Result<(), EventTicketNFTError> {
        // Check if caller is authorized
        if !self.verifiers.get(msg::sender()) && msg::sender() != self.owner.get() {
            return Err(EventTicketNFTError::NotAuthorized(NotAuthorized {}));
        }
        
        let mut ticket = self.tickets.setter(token_id);
        
        // Check if ticket exists
        if ticket.original_owner.get().is_zero() {
            return Err(EventTicketNFTError::TicketNotFound(TicketNotFound { token_id }));
        }
        
        // Check if already used
        if ticket.is_used.get() {
            return Err(EventTicketNFTError::TicketAlreadyUsed(TicketAlreadyUsed { token_id }));
        }
        
        // Mark as used
        ticket.is_used.set(true);
        ticket.used_at.set(U256::from(block::timestamp()));
        
        let current_used = self.total_used.get();
        self.total_used.set(current_used + U256::from(1));
        
        Ok(())
    }

    /// Check if a ticket is valid (not used and exists)
    pub fn is_ticket_valid(&self, token_id: U256) -> Result<bool, EventTicketNFTError> {
        let ticket = self.tickets.get(token_id);
        
        // Check if ticket exists
        if ticket.original_owner.get().is_zero() {
            return Ok(false);
        }
        
        // Ticket is valid if not used
        Ok(!ticket.is_used.get())
    }

    /// Get global statistics (total minted, total used)
    pub fn get_global_stats(&self) -> Result<(U256, U256), EventTicketNFTError> {
        let total_minted = self.erc721.total_supply.get();
        let total_used = self.total_used.get();
        Ok((total_minted, total_used))
    }

    /// Get dynamic token URI based on ticket status
    pub fn token_uri(&self, token_id: U256) -> Result<String, EventTicketNFTError> {
        // Verify token exists
        let owner = self.erc721.owner_of(token_id).map_err(|e| EventTicketNFTError::TicketNotFound(TicketNotFound { token_id }))?;
        
        let ticket = self.tickets.get(token_id);
        let event_name = String::from_utf8(ticket.event_name.get_bytes()).unwrap_or("Unknown Event".to_string());
        let event_date = String::from_utf8(ticket.event_date.get_bytes()).unwrap_or("TBD".to_string());
        let seat_info = String::from_utf8(ticket.seat_info.get_bytes()).unwrap_or("General Admission".to_string());
        
        let status_text = if ticket.is_used.get() { "Attended Event 🎉" } else { "Valid Ticket 🎟️" };
        
        // Build a simple JSON metadata string
        let json = format!(
            "{{\"name\":\"{} - {}\",\"description\":\"{}\",\"attributes\":[{{\"trait_type\":\"Status\",\"value\":\"{}\"}},{{\"trait_type\":\"Event\",\"value\":\"{}\"}},{{\"trait_type\":\"Seat\",\"value\":\"{}\"}}]}}",
            event_name, seat_info, status_text, status_text, event_name, seat_info
        );
        
        Ok(json)
    }

    /// Helper to check if caller is owner
    fn require_owner(&self) -> Result<(), EventTicketNFTError> {
        if msg::sender() != self.owner.get() {
            return Err(EventTicketNFTError::NotAuthorized(NotAuthorized {}));
        }
        Ok(())
    }

    /// Get all token IDs owned by an address (helper for frontend)
    /// Note: Limited to first 1000 tokens to prevent gas issues in demo
    pub fn get_tokens_by_owner(&self, owner: Address) -> Result<Vec<U256>, EventTicketNFTError> {
        let total_supply = self.erc721.total_supply.get();
        let mut tokens = Vec::new();
        
        // Cap at 1000 for demo safety - prevents U256 truncation issues
        let max_check = if total_supply > U256::from(1000) { U256::from(1000) } else { total_supply };
        
        // Iterate through tokens (up to 1000 for demo)
        let mut i = U256::ZERO;
        while i < max_check {
            if let Ok(token_owner) = self.erc721.owner_of(i) {
                if token_owner == owner {
                    tokens.push(i);
                }
            }
            i += U256::from(1);
        }
        
        Ok(tokens)
    }

    /// Mints an NFT, but does not call onErc712Received
    /// Enforces 1-ticket-per-wallet limit
    pub fn mint(&mut self) -> Result<(), Vec<u8>> {
        let minter = msg::sender();
        
        // Check 1-ticket-per-wallet limit
        if self.has_ticket.get(minter) {
            return Err(EventTicketNFTError::AlreadyHasTicket(AlreadyHasTicket { wallet: minter }).into());
        }
        
        self.erc721.mint(minter)?;
        self.has_ticket.insert(minter, true);
        Ok(())
    }

    /// Mints an NFT to the specified address, and does not call onErc712Received
    /// Enforces 1-ticket-per-wallet limit
    pub fn mint_to(&mut self, to: Address) -> Result<(), Vec<u8>> {
        // Check 1-ticket-per-wallet limit
        if self.has_ticket.get(to) {
            return Err(EventTicketNFTError::AlreadyHasTicket(AlreadyHasTicket { wallet: to }).into());
        }
        
        self.erc721.mint(to)?;
        self.has_ticket.insert(to, true);
        Ok(())
    }

    /// Mints an NFT and calls onErc712Received with empty data
    pub fn safe_mint(&mut self, to: Address) -> Result<(), Vec<u8>> {
        // Check 1-ticket-per-wallet limit for safe mint too
        if self.has_ticket.get(to) {
            return Err(EventTicketNFTError::AlreadyHasTicket(AlreadyHasTicket { wallet: to }).into());
        }
        
        Erc721::safe_mint(self, to, Vec::new())?;
        self.has_ticket.insert(to, true);
        Ok(())
    }

    /// Burns an NFT and clears has_ticket flag
    pub fn burn(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        // Get owner before burning
        let owner = self.erc721.owner_of(token_id).map_err(|e| e)?;
        
        // This function checks that msg::sender() owns the specified token_id
        self.erc721.burn(msg::sender(), token_id)?;
        
        // Clear has_ticket flag so owner can mint again
        self.has_ticket.insert(owner, false);
        
        Ok(())
    }
}
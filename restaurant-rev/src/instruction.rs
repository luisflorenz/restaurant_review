use borsh::BorshDeserialize;
use solana_program::program_error::ProgramError;

pub struct AccountState {
    pub title: String,
    pub rating: u8,
    pub description: String,
    pub location: String, // New field
}

pub enum ReviewInstruction {
    AddReview {
        title: String,
        rating: u8,
        description: String,
        location: String, // New field
    },

    UpdateReview {
        title: String,
        rating: u8,
        description: String,
        location: String, // New field
    },
    
}

#[derive(BorshDeserialize)]
struct ReviewPayload {
    title: String,
        rating: u8,
        description: String,
}

impl ReviewInstruction {
    pub fn unpack(imput: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = imput
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;
        let payload = ReviewPayload::try_from_slice(rest).unwrap();
        Ok(match variant {
            0 =>Self::AddReview { 
                title: payload.title,
                rating: payload.rating,
                description: payload.description,
            },

            1 =>Self::UpdateReview {
                title: payload.title,
                rating: payload.rating,
                description: payload.description,
            },
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
    
}
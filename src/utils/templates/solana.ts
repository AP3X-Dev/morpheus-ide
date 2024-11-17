import { FileType, FolderType } from '../../types';

export async function createSolanaProject(): Promise<(FileType | FolderType)[]> {
  return [
    {
      id: 'Cargo.toml',
      name: 'Cargo.toml',
      content: `[package]
name = "solana-program"
version = "0.1.0"
edition = "2021"
description = "Solana Smart Contract Project"

[lib]
crate-type = ["cdylib", "lib"]
name = "solana_program"

[features]
no-entrypoint = []

[dependencies]
solana-program = "1.16"
borsh = "0.10"
thiserror = "1.0"
num-derive = "0.3"
num-traits = "0.2"

[dev-dependencies]
solana-program-test = "1.16"
solana-sdk = "1.16"

[profile.release]
overflow-checks = true`,
      language: 'toml'
    },
    {
      id: 'src',
      name: 'src',
      items: [
        {
          id: 'src/lib.rs',
          name: 'lib.rs',
          content: `use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Program state
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ProgramState {
    pub count: u32,
    pub owner: Pubkey,
}

/// Program instructions
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum ProgramInstruction {
    Initialize,
    Increment,
    Decrement,
    Update { new_count: u32 },
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Solana program entrypoint");

    let instruction = ProgramInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    match instruction {
        ProgramInstruction::Initialize => {
            msg!("Instruction: Initialize");
            let state = ProgramState {
                count: 0,
                owner: *account.key,
            };
            state.serialize(&mut &mut account.data.borrow_mut()[..])?;
        }
        ProgramInstruction::Increment => {
            msg!("Instruction: Increment");
            let mut state = ProgramState::try_from_slice(&account.data.borrow())?;
            state.count = state.count.checked_add(1).ok_or(ProgramError::InvalidInstructionData)?;
            state.serialize(&mut &mut account.data.borrow_mut()[..])?;
        }
        ProgramInstruction::Decrement => {
            msg!("Instruction: Decrement");
            let mut state = ProgramState::try_from_slice(&account.data.borrow())?;
            state.count = state.count.checked_sub(1).ok_or(ProgramError::InvalidInstructionData)?;
            state.serialize(&mut &mut account.data.borrow_mut()[..])?;
        }
        ProgramInstruction::Update { new_count } => {
            msg!("Instruction: Update");
            let mut state = ProgramState::try_from_slice(&account.data.borrow())?;
            if *account.key != state.owner {
                return Err(ProgramError::InvalidAccountData);
            }
            state.count = new_count;
            state.serialize(&mut &mut account.data.borrow_mut()[..])?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_initialize() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<ProgramState>()];
        let owner = &program_id;

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            owner,
            false,
            Epoch::default(),
        );

        let instruction_data = ProgramInstruction::Initialize
            .try_to_vec()
            .unwrap();

        let accounts = vec![account];

        assert_eq!(
            process_instruction(&program_id, &accounts, &instruction_data),
            Ok(())
        );

        let state = ProgramState::try_from_slice(&accounts[0].data.borrow())
            .unwrap();

        assert_eq!(state.count, 0);
        assert_eq!(state.owner, key);
    }

    #[test]
    fn test_increment() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<ProgramState>()];
        let owner = &program_id;

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            owner,
            false,
            Epoch::default(),
        );

        // Initialize first
        let instruction_data = ProgramInstruction::Initialize
            .try_to_vec()
            .unwrap();
        let accounts = vec![account.clone()];
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        // Then increment
        let instruction_data = ProgramInstruction::Increment
            .try_to_vec()
            .unwrap();
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let state = ProgramState::try_from_slice(&accounts[0].data.borrow())
            .unwrap();

        assert_eq!(state.count, 1);
    }
}`,
          language: 'rust'
        },
        {
          id: 'src/error.rs',
          name: 'error.rs',
          content: `use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone, FromPrimitive)]
pub enum ProgramCustomError {
    #[error("Invalid instruction")]
    InvalidInstruction,
    #[error("Not rent exempt")]
    NotRentExempt,
    #[error("Expected amount mismatch")]
    ExpectedAmountMismatch,
    #[error("Amount overflow")]
    AmountOverflow,
}

impl From<ProgramCustomError> for ProgramError {
    fn from(e: ProgramCustomError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for ProgramCustomError {
    fn type_of() -> &'static str {
        "ProgramCustomError"
    }
}`,
          language: 'rust'
        },
        {
          id: 'src/instruction.rs',
          name: 'instruction.rs',
          content: `use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    system_program,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum ProgramInstruction {
    Initialize,
    Increment,
    Decrement,
    Update { new_count: u32 },
}

impl ProgramInstruction {
    pub fn initialize(
        program_id: &Pubkey,
        account: &Pubkey,
    ) -> Result<Instruction, ProgramError> {
        let data = ProgramInstruction::Initialize.try_to_vec()?;
        let accounts = vec![
            AccountMeta::new(*account, true),
            AccountMeta::new_readonly(system_program::id(), false),
        ];
        Ok(Instruction {
            program_id: *program_id,
            accounts,
            data,
        })
    }

    pub fn increment(
        program_id: &Pubkey,
        account: &Pubkey,
    ) -> Result<Instruction, ProgramError> {
        let data = ProgramInstruction::Increment.try_to_vec()?;
        let accounts = vec![AccountMeta::new(*account, false)];
        Ok(Instruction {
            program_id: *program_id,
            accounts,
            data,
        })
    }

    pub fn decrement(
        program_id: &Pubkey,
        account: &Pubkey,
    ) -> Result<Instruction, ProgramError> {
        let data = ProgramInstruction::Decrement.try_to_vec()?;
        let accounts = vec![AccountMeta::new(*account, false)];
        Ok(Instruction {
            program_id: *program_id,
            accounts,
            data,
        })
    }

    pub fn update(
        program_id: &Pubkey,
        account: &Pubkey,
        new_count: u32,
    ) -> Result<Instruction, ProgramError> {
        let data = ProgramInstruction::Update { new_count }.try_to_vec()?;
        let accounts = vec![AccountMeta::new(*account, true)];
        Ok(Instruction {
            program_id: *program_id,
            accounts,
            data,
        })
    }
}`,
          language: 'rust'
        }
      ]
    },
    {
      id: 'tests',
      name: 'tests',
      items: [
        {
          id: 'tests/integration.rs',
          name: 'integration.rs',
          content: `use borsh::BorshSerialize;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::Signer,
    transaction::Transaction,
};
use solana_program::instruction::InstructionError;

use solana_program::{
    program_pack::Pack,
    system_instruction,
};

#[tokio::test]
async fn test_counter_program() {
    let program_id = Pubkey::new_unique();
    let account_pubkey = Pubkey::new_unique();

    let mut program_test = ProgramTest::new(
        "solana_program",
        program_id,
        processor!(solana_program::process_instruction),
    );

    program_test.add_account(
        account_pubkey,
        Account {
            lamports: 5,
            data: vec![0_u8; 1000],
            owner: program_id,
            ..Account::default()
        },
    );

    let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

    // Initialize
    let mut transaction = Transaction::new_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![AccountMeta::new(account_pubkey, false)],
            data: solana_program::ProgramInstruction::Initialize.try_to_vec().unwrap(),
        }],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    // Increment
    let mut transaction = Transaction::new_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![AccountMeta::new(account_pubkey, false)],
            data: solana_program::ProgramInstruction::Increment.try_to_vec().unwrap(),
        }],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();
}`,
          language: 'rust'
        }
      ]
    },
    {
      id: '.gitignore',
      name: '.gitignore',
      content: `target/
**/*.rs.bk
Cargo.lock
.DS_Store`,
      language: 'plaintext'
    },
    {
      id: 'README.md',
      name: 'README.md',
      content: `# Solana Program Project

A Solana smart contract project with Rust, implementing a simple counter program.

## Features

- Basic counter program
- Borsh serialization
- Error handling
- Unit tests
- Integration tests
- Custom instructions

## Prerequisites

1. Install Rust:
   \`\`\`bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   \`\`\`

2. Install Solana CLI:
   \`\`\`bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
   \`\`\`

## Setup

1. Build the program:
   \`\`\`bash
   cargo build-bpf
   \`\`\`

2. Run tests:
   \`\`\`bash
   cargo test-bpf
   \`\`\`

## Program Structure

### State
- Counter value
- Owner pubkey

### Instructions
- Initialize: Set up program state
- Increment: Add 1 to counter
- Decrement: Subtract 1 from counter
- Update: Set counter to specific value

## Development

1. Run local validator:
   \`\`\`bash
   solana-test-validator
   \`\`\`

2. Deploy program:
   \`\`\`bash
   solana program deploy target/deploy/solana_program.so
   \`\`\`

## Project Structure

\`\`\`
├── src/
│   ├── lib.rs
│   ├── error.rs
│   └── instruction.rs
├── tests/
│   └── integration.rs
├── Cargo.toml
└── README.md
\`\`\`

## Testing

Run all tests:
\`\`\`bash
cargo test
\`\`\`

Run specific test:
\`\`\`bash
cargo test test_counter_program
\`\`\``,
      language: 'markdown'
    }
  ];
}
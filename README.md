# Tokenized Public Service Eligibility Verification System

This project implements a blockchain-based system for verifying eligibility for public services using Clarity smart contracts. The system provides a transparent, secure, and efficient way to manage citizen identity, service eligibility, document verification, benefit allocation, and audit trails.

## Overview

The system consists of five main smart contracts:

1. **Citizen Identity Contract**: Manages resident information and identity verification
2. **Eligibility Criteria Contract**: Records service requirements for different public services
3. **Documentation Verification Contract**: Validates supporting materials submitted by citizens
4. **Benefit Allocation Contract**: Manages service distribution to eligible citizens
5. **Audit Trail Contract**: Records benefit provision history for transparency and accountability

## Smart Contracts

### Citizen Identity Contract

This contract manages citizen information and identity verification:

- Register new citizens with basic information
- Verify citizen identities by authorized administrators
- Update citizen information
- Query citizen details

### Eligibility Criteria Contract

This contract defines the requirements for different public services:

- Add new service criteria (age, income, residency requirements, etc.)
- Update existing service criteria
- Activate or deactivate services
- Query service eligibility requirements

### Documentation Verification Contract

This contract handles the verification of supporting documents:

- Submit documents for verification (using document hashes for privacy)
- Verify submitted documents by authorized verifiers
- Query document verification status

### Benefit Allocation Contract

This contract manages the allocation of benefits to eligible citizens:

- Add new benefits with supply limits
- Allocate benefits to eligible citizens
- Mark benefits as used
- Query benefit details and citizen allocations

### Audit Trail Contract

This contract maintains a transparent record of all benefit-related actions:

- Record audit entries for all significant actions
- Query audit history for accountability

## Usage

### Deployment

Deploy the contracts in the following order:

1. Citizen Identity Contract
2. Eligibility Criteria Contract
3. Documentation Verification Contract
4. Benefit Allocation Contract
5. Audit Trail Contract

### Typical Workflow

1. Register citizens in the Citizen Identity Contract
2. Define service eligibility criteria in the Eligibility Criteria Contract
3. Citizens submit documents for verification
4. Administrators verify citizen documents
5. Administrators allocate benefits to eligible citizens
6. All actions are recorded in the Audit Trail Contract

## Testing

The project includes comprehensive tests for each contract using Vitest. Run the tests with:

\`\`\`
npm test
\`\`\`

## Security Considerations

- All administrative functions are protected with proper authorization checks
- Document contents are not stored on-chain; only hashes are stored for verification
- Audit trail ensures transparency and accountability
- Each contract has a separate admin for better security isolation

## Future Enhancements

- Integration with decentralized identity solutions
- Multi-signature requirements for administrative actions
- Time-locked benefit allocations
- Integration with off-chain verification systems


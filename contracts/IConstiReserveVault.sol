// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IConstiReserveVault
 * @notice Interface for the Kaspa L1 Covenant (ConstiReserveVault.silver)
 * This allows the L2 ConstiBridge to call the L1 vault safely.
 */
interface IConstiReserveVault {

    function contractReserves(uint256 amount, bytes calldata proof) external;
    function emergencyUnwind(bytes calldata proof) external;
    function redeemForSilver(bytes calldata proof, uint256 amount) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IConstiReserveVault {
    function contractReserves(uint256 amount, bytes calldata proof) external;
    function emergencyUnwind(bytes calldata proof) external;
    function redeemForSilver(bytes calldata proof, uint256 amount) external;
}

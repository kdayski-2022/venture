pragma solidity 0.4.24;
interface IReward {
    function newReward(
        string _description,
        bool _isMerit,
        address _referenceToken,
        address _rewardToken,
        uint256 _amount,
        uint64 _startBlock,
        uint64 _duration,
        uint8 _occurrences,
        uint64 _delay
    ) external  returns (uint256 rewardId);
}
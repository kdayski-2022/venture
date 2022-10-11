/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */
pragma experimental ABIEncoderV2;
pragma solidity 0.4.24;

import "./lib/ArrayUtils.sol";
import "hardhat/console.sol"; //!DEV
import "./lib/ERC20.sol";

contract VentureRemix {
    using SafeMath for uint256;
    using ArrayUtils for address[];

    /*
    
    privilegedUserList
    UserList
    amountPrivilegedUserList
    amountUserList
    minAmount 
    maxAmount
    minAmountPrivileged 
    maxAmountPrivileged
    successAddress
    commission
    weeziComission
    commissionPrivileged
    weeziComissionPrivileged
    maxNumbersOfContributers
    projectToken
    rewordAddress
    addressDepositToken
    addressCommunityToken
    distributionFeeType=1,2
    */

    string private constant ERROR_CAN_NOT_FORWARD = "AGENT_CAN_NOT_FORWARD";
    string private constant ERROR_TOKEN_NOT_ERC20 = "ERROR_TOKEN_NOT_ERC20";

    mapping(address => bool) public userList;
    mapping(address => bool) public privilegedUserList;

    address[] public privilegedUserWallet; // TODO SET PRIVATE

    uint256 public minAmountForUser; // мин платеж для юзера
    uint256 public maxAmountForUser; // макс платеж для юзера
    uint256 public minAmountForPrivilegedUser; // мин платеж для супер юзера
    uint256 public maxAmountForPrivilegedUser; // макс платеж для супер юзера

    address public walletAddressForSuccessFundraising; // адрес кошелька для успешной выплаты

    uint256 public commission; // комиссия дао в процентах
    uint256 public serviceComission; // комиссия weezi в процентах
    uint256 public commissionPrivileged; // комиссия дао в процентах для супер юзера
    uint256 public serviceComissionPrivileged; // комиссия weezi в процентах для супер юзера
    uint256 public maxNumbersOfContributers; // макс число для участия
    address public projectToken; // токен проекта
    address public rewordAddress; // адресс приложения reward
    address public addressContributeToken; // ???
    address public addressCommunityToken; // комьюнити токен
    uint8 public distributionFeeType; //1,2

    address public designatedSigner; // ???
    address[] public protectedTokens; // ???

    bool public locked; // сбор закрыт
    mapping(address => bool) public acceptableTokenAdded; // Разрешенные токены
    address[] internal acceptableTokens; // Разрешенные токены

    mapping(address => uint256) private successTokenAmount;
    address[] private successTokenList;
    mapping(address => uint256) private successTokenAmountComission;
    address[] private successTokenListComission;
    mapping(address => uint256) private successTokenAmountServiceComission;
    address[] private successTokenListServiceComission;
    // ++++++++++++++++++++++++++++++++++++++++
    struct Contribute {
        address user;
        address token;
        uint256 amount;
        bool privileged;
    }
    Contribute[] contributeList;

    function initialize(
        uint256 _minAmountForUser,
        uint256 _maxAmountForUser,
        uint256 _minAmountForPrivilegedUser,
        uint256 _maxAmountForPrivilegedUser,
        uint256 _commission,
        uint256 _serviceComission,
        uint256 _commissionPrivileged,
        uint256 _serviceComissionPrivileged,
        address _walletAddressForSuccessFundraising,
        uint256 _maxNumbersOfContributers
    ) external {
        minAmountForUser = _minAmountForUser;
        maxAmountForUser = _maxAmountForUser;
        minAmountForPrivilegedUser = _minAmountForPrivilegedUser;
        maxAmountForPrivilegedUser = _maxAmountForPrivilegedUser;

        commission = _commission;
        serviceComission = _serviceComission;
        commissionPrivileged = _commissionPrivileged;
        serviceComissionPrivileged = _serviceComissionPrivileged;

        walletAddressForSuccessFundraising = _walletAddressForSuccessFundraising;
        maxNumbersOfContributers = _maxNumbersOfContributers;
        // initialized(); // aragon app init
    }

    function contribute(
        ERC20 _addressContributeToken,
        uint256 _amountContributeToken // uint256 _optimisticPriceTimestamp, // bytes memory _signature
    ) {
        require(!locked, "LOCKED");
        require(
            acceptableTokenAdded[_addressContributeToken],
            "BAD CONTRIBUTE TOKEN"
        );
        require(!locked, "LOCKED");
        bool _privilegedUser = privilegedUserList[msg.sender];
        if (_privilegedUser) {
            require(
                _amountContributeToken > minAmountForPrivilegedUser,
                "MIN AMOUNT FOR PRIVELEGED USER"
            );
            require(
                _amountContributeToken < maxAmountForPrivilegedUser,
                "MAX AMOUNT FOR PRIVELEGED USER"
            );
        } else {
            require(
                _amountContributeToken > minAmountForUser,
                "MIN AMOUNT FOR USER"
            );
            require(
                _amountContributeToken < maxAmountForUser,
                "MAX AMOUNT FOR USER"
            );
        }

        _addressContributeToken.transferFrom(
            msg.sender,
            address(this),
            _amountContributeToken
        );
        contributeList.push(
            Contribute(
                msg.sender,
                _addressContributeToken,
                _amountContributeToken,
                _privilegedUser
            )
        );
    }

    function stopFundraising() {
        require(!locked, "LOCKED");

        for (uint256 i = 0; i < contributeList.length; i++) {
            Contribute storage contribute = contributeList[i];
            if (successTokenAmount[contribute.token] == 0) {
                successTokenList.push(contribute.token);
            }
            // calculate percentage

            successTokenAmount[contribute.token] = successTokenAmount[
                contribute.token
            ].add(contribute.amount);
        }
        for (uint256 j = 0; j < successTokenList.length; j++) {
            ERC20 token = ERC20(successTokenList[j]);
            token.transfer(
                walletAddressForSuccessFundraising,
                token.balanceOf(address(this))
            );
        }
        locked = true;
    }

    function calculatePercentage(uint256 total, uint256 percentage)
        public
        view
        returns (uint256)
    {
        // return total.mul(100).div(percentage).div(100);
        return total.mul(percentage).div(10000);
    }

    function getContributeLength() public view returns (uint256) {
        return contributeList.length;
    }

    function getContributes() public view returns (Contribute[] memory) {
        Contribute[] memory contributes = new Contribute[](
            contributeList.length
        );
        for (uint256 i = 0; i < contributeList.length; i++) {
            Contribute storage member = contributeList[i];
            contributes[i] = member;
        }
        return contributes;
    }

    function addPrivelegedUsers(address[] _address) {
        uint256 arrayLen = _address.length;
        for (uint256 i = 0; i < arrayLen; ++i) {
            if (!privilegedUserList[_address[i]]) {
                privilegedUserList[_address[i]] = true;
                privilegedUserWallet.push(_address[i]); // ! CHECK IT
            }
        }
    }

    function removePrivelegedUsers(address[] _address) {
        uint256 arrayLen = _address.length;
        for (uint256 i = 0; i < arrayLen; ++i) {
            if (privilegedUserList[_address[i]]) {
                privilegedUserList[_address[i]] = false;
                privilegedUserWallet.deleteItem(_address[i]); // ! CHECK IT
            }
        }
    }

    function setProjectToken(address _token) {
        // require(_isERC20(_token), ERROR_TOKEN_NOT_ERC20);
        projectToken = _token;
    }

    function addAcceptableToken(address _token) {
        require(acceptableTokens.length < 10, "LIST FULL");
        require(!acceptableTokenAdded[_token], "ALREADY ADDED");

        if (_token != address(0)) {
            // not is ETH
            //require(isContract(_token), ERROR_TOKEN_NOT_CONTRACT);
        }

        acceptableTokenAdded[_token] = true;
        acceptableTokens.push(_token);

        //emit AddAcceptableTokens(_token);
    }

    function removeAcceptableToken(
        address _token // external // auth(REMOVE_TOKEN_ROLE)
    ) {
        require(acceptableTokenAdded[_token], "ERROR_TOKEN_NOT_ADDED");

        acceptableTokenAdded[_token] = false;
        acceptableTokens.deleteItem(_token);

        // emit RemoveAcceptableToken(_token);
    }
}

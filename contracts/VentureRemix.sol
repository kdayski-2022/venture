/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */
pragma experimental ABIEncoderV2;
pragma solidity 0.4.24;

import "hardhat/console.sol"; //!DEV
import "./lib/ArrayUtils.sol";
import "./lib/ERC20.sol";
import "./IReward.sol";

contract VentureRemix {
    //is OracleClient
    using SafeMath for uint256;
    using SafeMath for uint16;
    using ArrayUtils for address[];
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
    address public walletAddressForServiceFundraising; // адрес кошелька для успешной выплаты
    address public walletAddressForDaoFundraising; // адрес кошелька для успешной выплаты
    address public rewardApp; // адрес кошелька для успешной выплаты
    uint16 public commission; // комиссия дао в процентах
    uint16 public serviceCommission; // комиссия сервиса в процентах
    uint16 public commissionPrivileged; // комиссия дао в процентах для супер юзера
    uint16 public serviceCommissionPrivileged; // комиссия сервиса в процентах для супер юзера
    uint16 public maxNumbersOfContributers; // макс число для участия
    address public projectToken; // токен проекта
    address public rewordAddress; // адресс приложения reward
    address public addressContributeToken; // ???
    address public addressCommunityToken; // комьюнити токен
    uint16 public distributionFeeType; //1,2 1 - %, 2 - % price
    uint256 public capAmount;
    uint256 public currentCapAmount;
    uint16 public baseTokenPrice;
    uint16 public currentTokenPrice;
    bool public locked; // сбор закрыт
    mapping(address => bool) public acceptableTokenAdded; // Разрешенные токены
    address[] internal acceptableTokens; // Разрешенные токены
    mapping(address => uint256) private successTokenAmount;
    address[] private successTokenList;
    mapping(address => uint256) private successTokenAmountCommission;
    address[] private successTokenListCommission;
    mapping(address => uint256) private successTokenAmountServiceCommission;
    address[] private successTokenListServiceCommission;
    // ++++++++++++++++++++++++++++++++++++++++
    struct Contribute {
        address user;
        address token;
        uint256 amount;
        uint256 clearAmount;
        uint256 projectTokensAmount;
        uint256 commissionAmount;
        uint256 serviceCommissionAmount;
        bool privileged;
    }
    event Initialize(
        uint256[4] _limitAmounts,
        uint16[4] _commissions,
        address[4] _wallets,
        uint16[3] _settings
    );
    event Contribution(
        uint256 contributeId,
        ERC20 addressContributeToken,
        uint256 amountContributeToken
    );
    mapping(uint256 => Contribute) contributeList;
    uint256 contributeListLength;

    function initialize(
        uint256[4] _limitAmounts,
        uint16[4] _commissions,
        address[4] _wallets,
        uint16[3] _settings
    ) public {
        // TODO Validate all settings
        minAmountForUser = _limitAmounts[0];
        maxAmountForUser = _limitAmounts[1];
        minAmountForPrivilegedUser = _limitAmounts[2];
        maxAmountForPrivilegedUser = _limitAmounts[3];
        commission = _commissions[0];
        serviceCommission = _commissions[1];
        commissionPrivileged = _commissions[2];
        serviceCommissionPrivileged = _commissions[3];
        walletAddressForSuccessFundraising = _wallets[0];
        walletAddressForServiceFundraising = _wallets[1];
        walletAddressForDaoFundraising = _wallets[2];
        rewardApp = _wallets[3];
        maxNumbersOfContributers = _settings[0];
        distributionFeeType = _settings[1];
        baseTokenPrice = _settings[2];
        emit Initialize(_limitAmounts, _commissions, _wallets, _settings);
        // initialized(); // aragon app init
    }

    function contribute(
        ERC20 _addressContributeToken,
        uint256 _amountContributeToken // uint256 _optimisticPriceTimestamp, // bytes memory _signature
    ) public returns (uint256 contributeId) {
        require(!locked, "LOCKED");
        require(_amountContributeToken > 0, "ZERO TOKEN AMOUNT");
        require(
            acceptableTokenAdded[_addressContributeToken],
            "BAD CONTRIBUTE TOKEN"
        );
        require(
            _addressContributeToken.allowance(msg.sender, address(this)) >=
                _amountContributeToken,
            "NOT HAVE ALLOWED TOKENS AMOUNT"
        ); // ? USE TOKEN MANAGER ?
        bool _privilegedUser = privilegedUserList[msg.sender];
        uint256 _commissionAmount = 0;
        uint256 _serviceCommissionAmount = 0;
        if (_privilegedUser) {
            require(
                _amountContributeToken > minAmountForPrivilegedUser,
                "MIN AMOUNT FOR PRIVELEGED USER"
            );
            require(
                _amountContributeToken <= maxAmountForPrivilegedUser,
                "MAX AMOUNT FOR PRIVELEGED USER"
            );
        } else {
            require(
                _amountContributeToken > minAmountForUser,
                "MIN AMOUNT FOR USER"
            );
            require(
                _amountContributeToken <= maxAmountForUser,
                "MAX AMOUNT FOR USER"
            );
        }
        if (distributionFeeType == 1) {
            _commissionAmount = calculatePercentage(
                _amountContributeToken,
                _privilegedUser ? commissionPrivileged : commission
            );
            _serviceCommissionAmount = calculatePercentage(
                _amountContributeToken,
                _privilegedUser
                    ? serviceCommissionPrivileged
                    : serviceCommission
            );
        }
        _addressContributeToken.transferFrom(
            msg.sender,
            address(this),
            _amountContributeToken
        );
        contributeId = contributeListLength++; // increment the rewards array to create a new one
        contributeList[contributeId] = Contribute(
            msg.sender,
            _addressContributeToken,
            _amountContributeToken,
            _amountContributeToken.sub(_commissionAmount).sub(
                _serviceCommissionAmount
            ),
            0,
            _commissionAmount,
            _serviceCommissionAmount,
            _privilegedUser
        );
        emit Contribution(
            contributeId,
            _addressContributeToken,
            _amountContributeToken
        );
    }

    function stopFundraising() public {
        require(!locked, "LOCKED");
        for (uint256 i = 0; i < contributeListLength; i++) {
            Contribute storage contributeItem = contributeList[i];
            if (successTokenAmount[contributeItem.token] == 0) {
                successTokenList.push(contributeItem.token);
            }
            successTokenAmount[contributeItem.token] = successTokenAmount[
                contributeItem.token
            ].add(contributeItem.clearAmount);
            successTokenAmountCommission[
                contributeItem.token
            ] = successTokenAmountCommission[contributeItem.token].add(
                contributeItem.commissionAmount
            );
            successTokenAmountServiceCommission[
                contributeItem.token
            ] = successTokenAmountServiceCommission[contributeItem.token].add(
                contributeItem.serviceCommissionAmount
            );
        }
        for (uint256 j = 0; j < successTokenList.length; j++) {
            ERC20 token = ERC20(successTokenList[j]);
            console.log(
                "::SUCCESS AMOUNT",
                successTokenAmount[successTokenList[j]]
            );
            console.log(
                "::COMISSION AMOUNT",
                successTokenAmountCommission[successTokenList[j]]
            );
            token.transfer(
                walletAddressForDaoFundraising,
                successTokenAmountCommission[successTokenList[j]]
            );
            console.log(
                "::SERVICE AMOUNT",
                successTokenAmountServiceCommission[successTokenList[j]]
            );
            token.transfer(
                walletAddressForSuccessFundraising,
                successTokenAmount[successTokenList[j]]
            );
            token.transfer(
                walletAddressForServiceFundraising,
                successTokenAmountServiceCommission[successTokenList[j]]
            );
        }
        locked = true;
    }

    function distributeProjectToken(uint256 _amount, uint256 _startUser)
        public
    {
        require(locked, "NOT YET LOCKED");
        require(projectToken != address(0), "NOT SET PROJECT TOKEN");
        ERC20 _token = ERC20(projectToken);
        // uint256 _amount = calculateNeedProjectTokens();
        require(
            _token.allowance(msg.sender, address(this)) >= _amount,
            "NOT HAVE ALLOWED TOKENS AMOUNT"
        );

        //SUCCESS FEE
        console.log("::currentCapAmount", currentCapAmount);
        //до момента, пока всем инвесторам не выплачены все первоначальные инвестиции,
        // все приходящие токены распределяются между всеми инвесторами в пропорции Community токенов.
        int256 userAmountTokens = 0;

        if (distributionFeeType == 2) {
            int256 availableAmountForDistributionFee = int256(
                currentCapAmount - capAmount
            );
            console.log("::availableAmountForDistributionFee");
            console.logInt(availableAmountForDistributionFee);
            if (availableAmountForDistributionFee > 0) {
                uint256 profitPerToken = currentTokenPrice.sub(baseTokenPrice);
                console.log("::profitPerToken", profitPerToken);

                uint256 successFeePerToken = profitPerToken.mul(commission); // ? check commision
                console.log("::successFeePerToken", successFeePerToken);

                uint256 successFeeAmountToken = ((successFeePerToken /
                    currentTokenPrice) * _amount) / 10000;
                console.log("::successFeeAmountToken", successFeeAmountToken);
                // uint256 successFeeAmountToken = calculateSuccessFeeAmountTokenForType2(_amount);//! PROD VERSION

                userAmountTokens = int256(_amount - successFeeAmountToken);
                console.log("::userAmountTokens");
                console.logInt(userAmountTokens);

                _token.transferFrom(
                    msg.sender,
                    walletAddressForServiceFundraising,
                    successFeeAmountToken
                );
                // TODO transfer to weezi service
            }
        } else {
            userAmountTokens = int256(_amount);
        }
        // IReward(rewardApp).newReward("Venture reward",true, addressCommunityToken,projectToken,userAmountTokens,0,0,1,0);//???
    }

    function setCapAmount(uint256 _amount) public {
        capAmount = _amount;
    }

    function setProjectTokenPrice(uint16 _price) public {
        currentTokenPrice = _price;
    }

    function calculatePercentage(uint256 total, uint256 percentage)
        public
        pure
        returns (uint256)
    {
        return total.mul(percentage).div(10000);
    }

    function calculateNeedProjectTokens() public view returns (uint256 amount) {
        for (uint256 j = 0; j < successTokenList.length; j++) {
            amount += successTokenAmount[successTokenList[j]];
        }
        return amount;
    }

    function calculateSuccessFeeAmountTokenForType2(uint256 _amount)
        public
        view
        returns (uint256 successFeeAmountToken)
    {
        uint256 profitPerToken = currentTokenPrice.sub(baseTokenPrice);
        uint256 successFeePerToken = profitPerToken.mul(commission);
        // return ((successFeePerToken / currentTokenPrice) * _amount) / 10000;
        return
            successFeePerToken.div(currentTokenPrice).mul(_amount).div(10000);
    }

    function getContributeLength() public view returns (uint256) {
        return contributeListLength;
    }

    function getContribute(uint256 contributeId)
        public
        view
        returns (Contribute[] memory)
    {
        Contribute[] memory contributes = new Contribute[](
            contributeListLength
        );
        Contribute storage member = contributeList[contributeId];
        contributes[contributeId] = member;
        return contributes;
    }

    function getContributes() public view returns (Contribute[] memory) {
        Contribute[] memory contributes = new Contribute[](
            contributeListLength
        );
        for (uint256 i = 0; i < contributeListLength; i++) {
            Contribute storage member = contributeList[i];
            contributes[i] = member;
        }
        return contributes;
    }

    function addPrivelegedUsers(address[] _address) public {
        uint256 arrayLen = _address.length;
        for (uint256 i = 0; i < arrayLen; ++i) {
            if (!privilegedUserList[_address[i]]) {
                privilegedUserList[_address[i]] = true;
                privilegedUserWallet.push(_address[i]);
            }
        }
    }

    function removePrivelegedUsers(address[] _address) public {
        uint256 arrayLen = _address.length;
        for (uint256 i = 0; i < arrayLen; ++i) {
            if (privilegedUserList[_address[i]]) {
                privilegedUserList[_address[i]] = false;
                privilegedUserWallet.deleteItem(_address[i]);
            }
        }
    }

    function setProjectToken(address _token) public {
        // require(_isERC20(_token), ERROR_TOKEN_NOT_ERC20);
        projectToken = _token;
    }

    function addAcceptableToken(address _token) public {
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
    ) public {
        require(acceptableTokenAdded[_token], "ERROR_TOKEN_NOT_ADDED");
        acceptableTokenAdded[_token] = false;
        acceptableTokens.deleteItem(_token);
        // emit RemoveAcceptableToken(_token);
    }
}

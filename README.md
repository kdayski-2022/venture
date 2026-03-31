# Venture (смарт-контракты)

Hardhat-проект со смарт-контрактом `Venture`, который реализует механику **сбора средств (fundraising)** в ERC-20 токенах с:

- лимитами взноса для обычных и привилегированных пользователей;
- списком **разрешённых (acceptable)** токенов для взносов;
- двумя комиссиями (DAO и сервис) и режимом расчёта комиссии;
- финализацией сбора (закрытием) и последующим распределением/учётом project token (частично заготовлено).

> В репозитории есть два варианта контракта: `Venture.sol` и `VentureRemix.sol`. В `scripts/dev.js` развёртывается и используется `VentureRemix`.

## Ключевые сущности

- **`contracts/Venture.sol` / `contracts/VentureRemix.sol`**: основной контракт.
- **`contracts/lib/ERC20.sol`**: тестовая реализация ERC-20 (используется в `scripts/dev.js` и тестах).
- **`contracts/lib/ArrayUtils.sol`**: утилиты для массивов (например, удаление адресов).
- **`contracts/IReward.sol`**: интерфейс внешнего reward-приложения (вызов `newReward` сейчас закомментирован/заготовлен).
- **`OracleClient.sol`**: заготовка клиента оракула (в текущем виде закомментирован).

## Как работает флоу (в общих чертах)

1. **Инициализация**: `initialize(limitAmounts, commissions, wallets, settings)`
   - лимиты взносов (min/max для user и privileged user),
   - комиссии (DAO/service для user и privileged),
   - кошельки-получатели (успешный сбор / сервис / DAO / reward app),
   - настройки (макс. число участников, тип комиссии `distributionFeeType`, базовая цена токена проекта `baseTokenPrice`).

2. **Настройка whitelist токенов**: `addAcceptableToken(token)`
   - только токены из этого списка можно использовать в `contribute`.

3. **Назначение привилегированных пользователей**: `addPrivelegedUsers(address[])`

4. **Взнос**: `contribute(token, amount)`
   - проверяются лимиты, whitelist токенов и `allowance`,
   - при `distributionFeeType == 1` комиссия считается как процент (basis points, деление на 10000),
   - токены переводятся на контракт, взнос сохраняется в `contributeList`.

5. **Остановка сбора**: `stopFundraising()`
   - суммирует «чистые» суммы и комиссии по каждому токену,
   - переводит:
     - DAO-комиссию на `walletAddressForDaoFundraising`,
     - «успешную» часть на `walletAddressForSuccessFundraising`,
     - сервис-комиссию на `walletAddressForServiceFundraising`,
   - выставляет `locked = true`.

6. **Project token** (заготовлено): `setProjectToken(token)`, `distributeProjectToken(amount, startUser)`
   - требуется `locked == true` и установленный `projectToken`,
   - для `distributionFeeType == 2` предусмотрен расчёт success-fee через `capAmount`, `currentTokenPrice`, `baseTokenPrice`,
   - распределение по пользователям и интеграция с `IReward` сейчас не завершены (вызов `newReward` закомментирован).

## Быстрый старт

### Требования

- Node.js + npm
- Доступ к `npx`

### Установка

```bash
npm install
```

### Запуск локальной сети

```bash
npm run rpc
```

### Дев-скрипт (deploy + демонстрация флоу)

Скрипт разворачивает тестовые ERC-20 токены, контракт `VentureRemix`, проводит внесение средств, останавливает сбор и выполняет вызовы для распределения project token.

```bash
npm run dev
```

### Тесты

```bash
npm test
```

## Важные замечания по безопасности/конфигурации

- **Solidity**: проект использует компилятор **0.4.24** (см. `hardhat.config.js`). Это старый компилятор; учитывайте ограничения и риски при продакшн-использовании.
- **Секреты в `hardhat.config.js`**: в конфиге присутствуют значения, похожие на приватные ключи и API-ключи. Для реального использования их нужно вынести в переменные окружения и исключить из репозитория.
- **`hardhat/console.sol`**: импортируется в контрактах (DEV). Для деплоя в прод обычно убирают dev-логи и/или используют отдельные сборки.

## Структура проекта

```text
venture/
  contracts/
    Venture.sol
    VentureRemix.sol
    IReward.sol
    lib/
      ERC20.sol
      ArrayUtils.sol
      SafeMath.sol
  scripts/
    dev.js
  test/
    venture/
      methods/
      index.js
    test.js
  hardhat.config.js
  package.json
```

## Полезные команды

- `npm run rpc`: поднять локальный Hardhat node
- `npm run dev`: прогнать сценарий из `scripts/dev.js`
- `npm test`: запустить тесты


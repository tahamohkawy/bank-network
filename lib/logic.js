'use strict';
/**
 * Write your transction processor functions here
 */

var NS = 'com.talentana.bc.bank';

/**
 * Open account transaction
 * @param {com.talentana.bc.bank.OpenAccount} openAccount
 * @transaction
 */
function openAccount(openAccount) {

    var accountId = Math.floor(Math.random());
    var account = getFactory().newResource(NS,'Account',accountId.toString());
    newAccount.owner = openAccount.owner;
    account.staus = Status.ACTIVE;

    return getAssetRegistry('com.talentana.bc.bank.Account')
        .then(function(assetRegistry){
            var openAccountEvent = getFactory().newEvent(NS,'AccountOpened');
            openAccountEvent.message = 'A new account opened at [DateTime] with account ID: '+accountId;
            openAccountEvent.account = account;
            emit(openAccountEvent);

            return assetRegistry.add(newAccount);
        });
}

/**
 * Close account transaction
 * @param {com.talentana.bc.bank.AccountClosed} accountClosed 
 * @transaction
 */
function closeAccount(accountClosed) {
    //Just mark the account as closed
    accountClosed.account.status = Status.CLOSED;

    return getAssetRegistry(NS+'.Account')
        .then(function(assetRegistry){
                //emit close account event
                var closeAccountEvent = getFactory().newEvent(NS,'AccountClosed');
                closeAccountEvent.message = 'An account closed at [DateTime] with account ID: '+accountClosed.account.accountId;
                closeAccountEvent.account = accountClosed.account;
                emit(closeAccountEvent);

                return assetRegistry.update(accountClosed.account);
        });
}


/**
 * Deposit amount in the account
 * @param {com.talentana.bc.bank.Deposit} deposit 
 * @transaction
 */
function deposit(deposit) {
    if(deposit.amount < 0 || deposit.amount == 0){
        throw new Error('Invalid amount to deposit.');
    }

    deposit.account.balance += deposit.amount;
    return getAssetRegistry(NS+'.Account')
        .then(function(assetRegistry){
            //emit the event for deposit
            var depositEvent = getFactory().newEvent(NS,'Deposited');
            depositEvent.message = 'A new deposit of '+deposit.amount+' in '+deposit.account.accountId;
            depositEvent.amount = deposit.amount;
            depositEvent.account = deposit.account;
            emit(depositEvent);

            return assetRegistry.update(depositEvent.account);
        });
}


/**
 * Withdraw amount transaction
 * @param {com.talentana.bc.bank.WithDraw} withDraw
 * @transaction
 */
function withdraw(withDraw) {
    if(withDraw.amount < 0 ){
        throw new Error('Invalid withDraw amount.');
    }

    withDraw.account.balance-=withDraw.amount;

    return getAssetRegistry(NS+'.Account')
        .then(function(assetRegistry){
                //Emit the withdraw event
                var withdrawEvent = getFactory().newEvent(NS,'WithDrawn');
                withdrawEvent.message='A new withdraw of '+withDraw.amount+' from '+withDraw.account.accountId;
                withdrawEvent.amount=withDraw.amount;
                withdrawEvent.account=withDraw.account;
                emit(withdrawEvent);

                //Update the registry
                return assetRegistry.update(withDraw.account);
        });
}

/**
 * Transfer amount between 2 accounts
 * @param {com.talentana.bc.bank.Transfer} transfer
 * @transaction
 */
function transfer(transfer){
    if(transfer.amount < 0){
        throw new Error('Invalid transfer amount.');
    }

    transfer.from.balance-=transfer.amount;
    transfer.to.balance+=transfer.amount;

    return getAssetRegistry(NS+'.Account')
        .then(function(assetRegistry){
              return assetRegistry.update(transfer.from);
        }).then(function(){
            getAssetRegistry(NS+'.Account')
                .then(function(assetRegistry){
                    return assetRegistry.update(transfer.to);
                });
        }).then(function(){
            //emit the event for the transfer and then update both accounts
            var transferEvent = getFactory().newEvent(NS,'Transfered');
            transferEvent.message=transfer.amount+' was transferred from '+transfer.from+' to '+transfer.to;
            transferEvent.amount=transfer.amount;
            transferEvent.from=transfer.from;
            transferEvent.to=transferEvent.to;
            emit(transferEvent);
        });
}
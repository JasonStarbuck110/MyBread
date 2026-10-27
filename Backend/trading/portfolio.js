function createPortfolio() {
    return{
        cashCents: 0,
        holdings: {},
        transactions: [],
        rewardHistory:[]
    };
}

function creditReward(portfolio, rewardId, amountCents) {
    if(!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        throw new Error("Invalid Reward amount");
    }

    if(typeof rewardId !== "string" || rewardId.trim() === "") {
        throw new Error("Invalid Reward ID");
    }

    const alreadyClaimed = portfolio.rewardHistory.some(reward => reward.id === rewardId);
    if(alreadyClaimed) {
        throw new Error("Reward Already Claimed");
    }

    if(!Number.isSafeInteger(portfolio.cashCents + amountCents)) {
        throw new Error("Wallet Balance Exceeds Supported range");
    }

    portfolio.cashCents += amountCents;
    portfolio.rewardHistory.push({
        id: rewardId,
        amountCents: amountCents,
        earnedAt: new Date().toISOString()
    });
    
    return portfolio.cashCents;
}

module.exports = {createPortfolio, creditReward};
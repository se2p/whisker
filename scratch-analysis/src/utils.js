const getAllBlocks = targets => targets.reduce((acc, target) => Object.assign(acc, target.blocks._blocks), {});

const countAllBlocks = targets => targets.reduce((acc, target) => acc + Object.keys(target.blocks._blocks).length, 0);

const getBranchStart = statement => {
    if (statement.inputs.hasOwnProperty('SUBSTACK')) {
        return statement.inputs.SUBSTACK.block;
    }
};

const getElseBranchStart = statement => {
    if (statement.inputs.hasOwnProperty('SUBSTACK2')) {
        return statement.inputs.SUBSTACK2.block;
    }
};

const Extract = {
    broadcastForBlock: block =>
        block.fields.BROADCAST_OPTION.value.toLowerCase(),
    broadcastForStatement: (blocks, statement) =>
        Extract.broadcastForBlock(blocks.get(statement.inputs.BROADCAST_INPUT.block)),
    backdropStartTarget: (statement) =>
        statement.fields.BACKDROP.value,
    backdropChangeTarget: (blocks, statement) => {
        const argumentBlock = blocks.get(statement.inputs.BACKDROP.block);
        if("BACKDROP" in argumentBlock.fields){
            return argumentBlock.fields.BACKDROP.value;
        }
    },
    cloneCreateTarget: (blocks, statement) =>
        blocks.get(statement.inputs.CLONE_OPTION.block).fields.CLONE_OPTION.value,
    cloneSendTarget: block =>
        block.target,
    direction: (blocks, statement) =>
        parseInt(blocks.get(statement.inputs.DIRECTION.block).fields.NUM.value, 10),
    xPosition: (blocks, statement) =>
        parseInt(blocks.get(statement.inputs.X.block).fields.NUM.value, 10),
    yPosition: (blocks, statement) =>
        parseInt(blocks.get(statement.inputs.Y.block).fields.NUM.value, 10),
    sizeValue: (blocks, statement) =>
        parseInt(blocks.get(statement.inputs.SIZE.block).fields.NUM.value, 10),
    costume: (blocks, statement) =>
        blocks.get(statement.inputs.COSTUME.block).fields.COSTUME.value,
    backdrop: (blocks, statement) =>
        blocks.get(statement.inputs.BACKDROP.block).fields.BACKDROP.value,
    variableValue: (blocks, statement) =>
        blocks.get(statement.inputs.VALUE.block).fields.TEXT.value,
    stopOption: block =>
        block.fields.STOP_OPTION.value,
    clickedSprite: block =>
        block.target,
    clickedKey: block =>
        block.fields.KEY_OPTION.value
};

export {
    countAllBlocks,
    getAllBlocks,
    getBranchStart,
    getElseBranchStart,
    Extract
};

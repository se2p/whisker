const targetForBlockId = (targets, blockId) => {
    for (const target of targets) {
        if (target.blocks._blocks.hasOwnProperty(blockId)) {
            return target;
        }
    }
};

const getAllBlocks = targets => targets.reduce((acc, target) => Object.assign(acc, target.blocks._blocks), {});

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
        block.fields.BROADCAST_OPTION.value,
    broadcastForStatement: (blocks, statement) =>
        Extract.broadcastForBlock(blocks[statement.inputs.BROADCAST_INPUT.block]),
    backdropStartTarget: (blocks, statement) =>
        statement.fields.BACKDROP.value,
    backdropChangeTarget: (blocks, statement) =>
        blocks[statement.inputs.BACKDROP.block].fields.BACKDROP.value,
    cloneCreateTarget: (blocks, statement) =>
        blocks[statement.inputs.CLONE_OPTION.block].fields.CLONE_OPTION.value,
    cloneSendTarget: (targets, block) =>
        targetForBlockId(targets, block.id).sprite.name,
    direction: (blocks, statement) =>
        parseInt(blocks[statement.inputs.DIRECTION.block].fields.NUM.value, 10),
    xPosition: (blocks, statement) =>
        parseInt(blocks[statement.inputs.X.block].fields.NUM.value, 10),
    yPosition: (blocks, statement) =>
        parseInt(blocks[statement.inputs.Y.block].fields.NUM.value, 10),
    sizeValue: (blocks, statement) =>
        parseInt(blocks[statement.inputs.SIZE.block].fields.NUM.value, 10),
    costume: (blocks, statement) =>
        blocks[statement.inputs.COSTUME.block].fields.COSTUME.value,
    backdrop: (blocks, statement) =>
        blocks[statement.inputs.BACKDROP.block].fields.BACKDROP.value,
    variableValue: (blocks, statement) =>
        blocks[statement.inputs.VALUE.block].fields.TEXT.value,
    stopOption: block =>
        block.fields.STOP_OPTION.value,
    clickedSprite: (targets, block) =>
        targetForBlockId(targets, block.id).sprite.name,
    clickedKey: block =>
        block.fields.KEY_OPTION.value
};

export {
    getAllBlocks,
    getBranchStart,
    getElseBranchStart,
    Extract
};

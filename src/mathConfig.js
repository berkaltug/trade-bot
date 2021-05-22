const {create , all } = require('mathjs');
const mathjs = create(all);
mathjs.config({ number: 'BigNumber' , precision : 16});
module.exports=mathjs;
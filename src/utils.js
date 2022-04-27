exports.intervalToMs = (interval) => {
    switch (interval) {
      case "1m":
        return 1000 * 60;
  
      case "3m":
        return 1000 * 60 * 3;
  
      case "5m":
        return 1000 * 60 * 5;
  
      case "15m":
        return 1000 * 60 * 15;
  
      case "30m":
        return 1000 * 60 * 30;
  
      case "1h":
        return 1000 * 60 * 60;
  
      case "2h":
        return 1000 * 60 * 60 * 2;
  
      case "4h":
        return 1000 * 60 * 60 * 4;
  
      case "6h":
        return 1000 * 60 * 60 * 6;
  
      case "8h":
        return 1000 * 60 * 60 * 8;
  
      case "12h":
        return 1000 * 60 * 60 * 12;
  
      case "1d":
        return 1000 * 60 * 60 * 24;
  
      default:
        return null;
    }
  };
  
exports.last=arr=>arr[arr.length-1]
exports.last2nd=arr=>arr[arr.length-2]

exports.fillArrayRepating=(arr,amount)=>{
  let result=[];
  for(let i=0;i<arr.length;i++){
    for(let j=0;j<amount;j++){
      result.push(arr[i]);
    }
  }
  return result;
}

exports.intervalToMinute=(interval)=>{
  switch (interval) {
    case "1m":
      return 1;

    case "3m":
      return 3;

    case "5m":
      return 5;

    case "15m":
      return  15;

    case "30m":
      return  30;

    case "1h":
      return  60;

    case "2h":
      return  60 * 2;

    case "4h":
      return  60 * 4;

    case "6h":
      return  60 * 6;

    case "8h":
      return  60 * 8;

    case "12h":
      return  60 * 12;

    case "1d":
      return  60 * 24;

    default:
      return null;
  }
}

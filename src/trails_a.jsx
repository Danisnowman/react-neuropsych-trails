const d = 44; //diameter

function tokens() {
  const xlowest = 50;
  const xhighest = 710;
  const ylowest = 50;
  const yhighest = 510;
  const d2 = d + 10;

  let tokens = [];
  let xrange = [];
  let yrange = [];

  for (let i = 0; i < 25; i++) {
    const x = Math.round(xlowest + Math.random() * (xhighest - xlowest));
    xrange.push(x);
  }

  let i = 0;
  while (i < 25) {
    const y = Math.round(ylowest + Math.random() * (yhighest - ylowest));

    const ycheck = yrange.every((yr, index) => {
      if (!(y + d2 - yr < 0 || yr + d2 - y < 0)) {
        return (
          xrange[i] + d2 - xrange[index] < 0 ||
          xrange[index] + d2 - xrange[i] < 0
        );
      }

      return true;
    });

    if (ycheck) {
      yrange.push(y);
      i++;
    }
  }

  for (let k = 0; k < 25; k++) {
    tokens.push({
      x: xrange[k],
      y: yrange[k],
      text: "" + (k + 1),
    });
  }
  //console.log(tokens);
  return tokens;
}

export default function obj() {
  return {
    width: 758,
    height: 558,
    diameter: d,
    tokens: tokens(),
  };
}

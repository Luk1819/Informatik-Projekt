const prompt = require('prompt');

prompt.start();

const commandQuery = [
    {
      name: 'command',
      validator: /^(w(est)?|s(outh)?|n(orth)?|e(ast)?)$/,
      warning: "Allowed commands are: 'west', 'south', 'north', 'east'"
    }
  ];

prompt.get(['username'], function (err, result) {
  if (err) {
    return onErr(err);
  }

  console.log('Command-line input received:');
  console.log('  Username: ' + result.username);
  console.log('  Email: ' + result.email);
});

function onErr(err) {
  console.log(err);
  return 1;
}
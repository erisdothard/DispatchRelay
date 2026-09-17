/**
 * The only JavaScript on a marketing page. It upgrades the waitlist form to a
 * fetch submission; with JS off or broken the form still posts normally to the
 * same endpoint, so signing up never depends on this running.
 */
export const waitlistIsland = `
(function () {
  var form = document.querySelector('[data-waitlist]');
  if (!form) return;
  var status = document.querySelector('[data-waitlist-status]');
  var button = form.querySelector('button[type="submit"]');

  function say(message, state) {
    if (!status) return;
    status.textContent = message;
    status.setAttribute('data-state', state);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = new FormData(form).get('email');
    if (!email) return;

    button.disabled = true;
    say('Adding you…', 'pending');

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) throw new Error(body.error || 'That did not go through.');
          return body;
        });
      })
      .then(function () {
        form.reset();
        say("You're on the list. We'll email you when access opens.", 'ok');
      })
      .catch(function (error) {
        say(error.message || 'That did not go through. Try again in a moment.', 'error');
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
`;

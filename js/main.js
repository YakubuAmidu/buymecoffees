document.querySelector('.donation-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const messageBox = document.getElementById('form-message');
  messageBox.classList.add('hidden');

  if (!amount || amount <= 0) {
    showMessage('error', '⚠️ Please enter a valid amount!');
    return;
  }

  try {
    const response = await fetch('https://buymecoffees-app.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (data.url) {
      showMessage('success', '✅ Redirecting to Stripe checkout...');
      setTimeout(() => {
        window.location.href = data.url;
      }, 1000);
    } else {
      showMessage('error', '❌ Something went wrong. Try again!');
    }
  } catch (error) {
    console.error("❌ Server error:", error);
    showMessage('error', '❌ Server issue — try again later!');
  }
});

function showMessage(type, text) {
  const messageBox = document.getElementById('form-message');
  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
  messageBox.classList.remove('hidden');
}









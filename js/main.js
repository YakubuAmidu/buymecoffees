document.querySelector('.donation-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const messageBox = document.getElementById('form-message');
  messageBox.classList.add('hidden');

  if (!amount || amount <= 0) {
    messageBox.textContent = "⚠️ Please enter a valid amount!";
    messageBox.className = "form-message error";
    messageBox.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch('https://558e-2607-fb90-bda8-5e9c-f864-bec6-4f88-6996.ngrok-free.app/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (data.url) {
      messageBox.textContent = "✅ Redirecting to payment...";
      messageBox.className = "form-message success";
      messageBox.classList.remove('hidden');
      setTimeout(() => window.location.href = data.url, 1500);
    } else {
      messageBox.textContent = "❌ Something went wrong!";
      messageBox.className = "form-message error";
      messageBox.classList.remove('hidden');
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
    messageBox.textContent = "❌ Server error — please try again!";
    messageBox.className = "form-message error";
    messageBox.classList.remove('hidden');
  }
});








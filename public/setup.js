fetch('/setup-status').then(r => r.json()).then(status => {
  Object.entries(status).forEach(([step, status]) => {
    document.querySelector(step).toggle()
  })
});
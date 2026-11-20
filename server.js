const { createApp } = require('./src/app');

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`Student portal running on port ${PORT}`);
});

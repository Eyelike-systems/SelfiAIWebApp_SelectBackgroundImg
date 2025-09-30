// path of this file /home/ubuntu/nodebackendM
/// file name ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "app",
      script: "./app.js",
      cwd: "/home/ubuntu/nodebackendM", // Adjust if your main file is elsewhere
      interpreter: "node",
    },
    {
      name: "rb",
      script: "/home/ubuntu/nodebackendM/python/my_env/bin/uvicorn",
      args: "rb:app --host 0.0.0.0 --port 8000",
      cwd: "/home/ubuntu/nodebackendM/python",
      interpreter: "none" // ← tells PM2 not to wrap the script in node/python
    }
  ]
}
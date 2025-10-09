from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from typing import List

app = FastAPI()

html = """
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebSockets</title>
  </head>
  <body>
    <h1>Learning WebSockets</h1>
    <h2 id="ws-id">Your id:></h2>
    <form action="" onsubmit="sendMessage(event)">
      <input type="text" id="messageText" autocomplete="off" />
      <button type="submit">Send</button>
    </form>
    <ul id="messages"></ul>
    <script>
      var client_id = Date.now()
      document.getElementById("ws-id").textContent = client_id;
            var ws = new WebSocket(`ws://localhost:8000/ws/${client_id}`);
      ws.onmessage = function (event) {
        var messages = document.getElementById("messages");
        var message = document.createElement("li");
        var content = document.createTextNode(event.data);
        message.appendChild(content);
        messages.appendChild(message);
      };
      function sendMessage(event) {
        var input = document.getElementById("messageText");
        ws.send(input.value);
        input.value = "";
        event.preventDefault();
      }
    </script>
  </body>
</html>
    
"""


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_msg(self, msg: str, websocket: WebSocket):
        await websocket.send_text(msg)

    async def broadcast_messages(self, msg: str, websocket: WebSocket, client_id: int):
        for connection in self.active_connections:
            await connection.send_text(msg)


connect_manager = ConnectionManager()


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await connect_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # await connect_manager.send_msg(f"me:", websocket)
            await connect_manager.broadcast_messages(
                f"{client_id} : {data}", websocket, client_id
            )

    except WebSocketDisconnect:
        connect_manager.disconnect(websocket)
        await connect_manager.broadcast_messages(
            f"{client_id} left the chat", websocket, client_id
        )

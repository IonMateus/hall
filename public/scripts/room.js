const socket = io();
const roomNameElement = document.getElementById('roomName');
const messagesElement = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

const roomName = window.location.pathname.split('/').pop();
roomNameElement.innerText = `- ${roomName} -`;

socket.emit("verifyRoom",(roomName))
document.title = "Room: "+ roomName

socket.on("enterRoom", (roomExists) => {
  if (roomExists) { 
    document.getElementById("passwordForm").style.display = "block"
  } else {
    document.body.innerHTML = `
<div class="bg-gray-800 flex justify-center items-center h-screen">
    <div class="bg-gray-900 rounded-lg p-8 text-white text-center animate-pulse">
        <h1 class="text-4xl font-bold mb-4">Room does not exist</h1>
        <a href="../../" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">Go back</a>
    </div>
</div>`;
  }
})

function Password(){
  socket.emit('joinRoom', {roomName:roomName,password:(document.getElementById("passwordInput").value)});  
  document.getElementById("passwordForm").style.display = "none"
}

socket.on("joinRoom", (data)=>{socket.emit("joinRoom", (data))})

socket.on("CanJoinRoom", res=>{
  if(res===true){
    document.getElementById("usernameForm").style.display = "block"
  }else{
    createNotification("You can't enter this room.")
    setTimeout(() => {
      window.location.href = "../../"
    }, 5000);
  }
})

function Username(){
  let username = document.getElementById("usernameInput").value
  if(username=="" || username==" " || username==null){username="Undefined"}
  socket.emit("username",(username))   
  document.getElementById("usernameForm").style.display = "none"
}

socket.on("updateUsernames", (usernames) => {
  var code = ""
  for(i in usernames){
    code += `<div class="user-item">${usernames[i]}</div>`
  }
  document.getElementById("usernamesDiv").innerHTML = code
});


socket.on('message', (data) => {
  message(data)
});

function sendMessage() {
  const message = messageInput.value.trim()
  if (message) {
    socket.emit('message', { roomName, message})
    messageInput.value = ''
  }
}

socket.on("sendImageToRoom", data => { 
  message(data)
})

let messageDiv = document.getElementById('messages')

function scrollToBottom() {
  messageDiv.scrollTop = messagesElement.scrollHeight
}

document.getElementById("usernamesDiv").addEventListener("wheel", function(event) {
  if (event.deltaY !== 0) {
    this.scrollLeft += event.deltaY;
    event.preventDefault();
  }
});


function validateImage(input) {
  const file = input.files[0];
  if (file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"];
    
    if (allowedTypes.includes(file.type)) {
      socket.emit("sendImage", { file, roomName });
      input.value = ''; 
    } else {
      createNotification("Invalid image type. Please upload a valid image.");
      input.value = ''; 
    }
  }
}

/*
function validateImage(input) {
  const file = input.files[0];
  if (file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"]; // Lista de tipos MIME de imagens permitidos
    if (allowedTypes.includes(file.type)) {
      socket.emit("sendImage", { file, roomName });
      input.value = '';
    } 
  }
}

function XvalidateImage(input) {
  const file = input.files[0];
  if (file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"];
    if (allowedTypes.includes(file.type)) {
      socket.emit("sendImage", { file, roomName });
      input.value = '';
    } else {
      if (file.type.startsWith('image/')) {
        socket.emit("sendImage", { file, roomName });
      input.value = '';
      } else {
        createNotification("Invalid Image");
        input.value = '';
      }
    }
  }
}


function validateImage(input){
  const file = input.files[0];
  if (file) {
    result = validateFile(file)
    if(result){
      socket.emit("sendImage", { file, roomName });
      input.value = '';
    }else{
      createNotification(result)
    }
  }
}
*/

function validateFile(upload) {
  if (upload.size === 0) return "Image not uploaded correctly.";
  if (upload.size > 2097152) { // 2MB in bytes
    const filesize = upload.size / 1048576; // Convert bytes to Megabytes
    return "The image you uploaded has a filesize that is too large. Please reduce your image to < 2MB. It is currently " + filesize.toFixed(2) + "MB.";
  }
  const allowedTypes = ["image/gif", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(upload.type)) {
    return "Uploads of that file type are not allowed. You need a jpg, png, or gif image.";
  }
  const blacklist = [".php", ".phtml", ".php3", ".php4", ".ph3", ".ph4"];
  for (let item of blacklist) {
    if (upload.name.toLowerCase().endsWith(item)) {
      return "Uploads with that file extension are not allowed. You need an image ending in .jpg, .png, or .gif";
    }
  }
  return true; // Validation passed
}


function message(data){
  const messageDiv = document.createElement('div')
  messageDiv.className = "flex items-start mb-1 p-2 rounded-lg"
  let messageElement

  const messageUser = document.createElement('p')
  if(data.file){
    var blob = new Blob([data.file])
    var imageUrl = URL.createObjectURL(blob)
    messageElement = document.createElement("img")
    messageElement.src = imageUrl
    messageElement.style.maxWidth = "60%";
  }else{
    messageElement = document.createElement('p')
    messageElement.innerText = `${data.message}`
  }
  
  messageUser.innerText = `${data.user}:`

  messageUser.className = "text-gray-400 text-sm mr-2"
  messageElement.className = "text-white"

  messageDiv.appendChild(messageUser)
  messageDiv.appendChild(messageElement)

  const messagesElement = document.getElementById('messages')
  messagesElement.appendChild(messageDiv)

  messageElement.style.wordWrap = "break-word"

  if (data.socketId === socket.id) {
    messageDiv.style.justifyContent = 'flex-end'
    messageUser.classList.add('ml-1')
    messageElement.classList.add('bg-blue-500', 'rounded-lg', 'px-3', 'py-1')
  } else {
    messageDiv.style.justifyContent = 'flex-start'
    messageUser.classList.add('mr-1')
    messageElement.classList.add('bg-gray-700', 'rounded-lg', 'px-3', 'py-1')
  }

  messagesElement.scrollTop = messagesElement.scrollHeight
}

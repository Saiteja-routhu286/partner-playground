const firebaseConfig = {
  apiKey: "AIzaSyD5-Pmz7r4hWenMkizocJ1xhGlEVTs8Occ",
  authDomain: "partner-playground-35810.firebaseapp.com",
  projectId: "partner-playground-35810",
  storageBucket: "partner-playground-35810.appspot.com",
  messagingSenderId: "1363057254",
  appId: "1:1363057254:web:2e9fdc79a3f52c449e2ba7",
  measurementId: "G-TFTREGBG9Z"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const authDiv = document.getElementById("auth");
const playgroundDiv = document.getElementById("playground");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

const userName = document.getElementById("userName");

const postText = document.getElementById("postText");
const imageInput = document.getElementById("image");
const postBtn = document.getElementById("postBtn");

const feed = document.getElementById("feed");

const tabs = document.querySelectorAll(".tabBtn");
const tabContents = document.querySelectorAll(".tab");

const taskText = document.getElementById("taskText");
const addTask = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

const noteText = document.getElementById("noteText");
const addNote = document.getElementById("addNote");
const noteList = document.getElementById("noteList");

// Tabs
tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    tabContents.forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Signup
signupBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) return alert("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      db.collection("users").doc(user.user.uid).set({ name });
    })
    .catch(err => alert(err.message));
});

// Login
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
});

// Logout
logoutBtn.addEventListener("click", () => auth.signOut());

// Auth state
auth.onAuthStateChanged(user => {
  if (user) {
    authDiv.classList.add("hidden");
    playgroundDiv.classList.remove("hidden");

    db.collection("users").doc(user.uid).get().then(doc => {
      userName.innerText = doc.data().name;
    });

    loadFeed();
    loadTasks();
    loadNotes();
  } else {
    authDiv.classList.remove("hidden");
    playgroundDiv.classList.add("hidden");
  }
});

// Post with image
postBtn.addEventListener("click", async () => {
  const text = postText.value.trim();
  const file = imageInput.files[0];

  if (!text && !file) return alert("Write or select image");

  const user = auth.currentUser;

  let imageUrl = null;

  if (file) {
    const storageRef = storage.ref(`images/${Date.now()}_${file.name}`);
    await storageRef.put(file);
    imageUrl = await storageRef.getDownloadURL();
  }

  await db.collection("posts").add({
    uid: user.uid,
    name: userName.innerText,
    text,
    imageUrl,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  postText.value = "";
  imageInput.value = "";
});

// Load feed
function loadFeed() {
  db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    feed.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.classList.add("card");

      const time = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : "";

      card.innerHTML = `
        <b>${data.name}</b> • <small>${time}</small><br>
        ${data.text ? data.text : ""}<br>
        ${data.imageUrl ? `<img src="${data.imageUrl}" />` : ""}
      `;

      if (data.uid === auth.currentUser.uid) {
        const del = document.createElement("button");
        del.classList.add("deleteBtn");
        del.innerText = "Delete";
        del.onclick = () => db.collection("posts").doc(doc.id).delete();
        card.appendChild(del);
      }

      feed.appendChild(card);
    });
  });
}

// Tasks
addTask.addEventListener("click", () => {
  const text = taskText.value.trim();
  if (!text) return;

  db.collection("tasks").add({
    uid: auth.currentUser.uid,
    text,
    done: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  taskText.value = "";
});

function loadTasks() {
  db.collection("tasks").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    taskList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <b>${data.text}</b><br>
        <small>${data.done ? "Completed" : "Pending"}</small>
      `;

      if (data.uid === auth.currentUser.uid) {
        const del = document.createElement("button");
        del.classList.add("deleteBtn");
        del.innerText = "Delete";
        del.onclick = () => db.collection("tasks").doc(doc.id).delete();
        card.appendChild(del);
      }

      taskList.appendChild(card);
    });
  });
}

// Notes
addNote.addEventListener("click", () => {
  const text = noteText.value.trim();
  if (!text) return;

  db.collection("notes").add({
    uid: auth.currentUser.uid,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  noteText.value = "";
});

function loadNotes() {
  db.collection("notes").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    noteList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <b>Note</b><br>
        ${data.text}
      `;

      if (data.uid === auth.currentUser.uid) {
        const del = document.createElement("button");
        del.classList.add("deleteBtn");
        del.innerText = "Delete";
        del.onclick = () => db.collection("notes").doc(doc.id).delete();
        card.appendChild(del);
      }

      noteList.appendChild(card);
    });
  });
}

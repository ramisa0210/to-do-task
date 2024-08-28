// script.js

document.addEventListener('DOMContentLoaded', () => {
    const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
    const API_KEY = 'YOUR_GOOGLE_API_KEY';
    const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    const SCOPES = "https://www.googleapis.com/auth/calendar.events";

    const authorizeButton = document.getElementById('authorize-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const clearTasksBtn = document.getElementById('clear-tasks-btn');
    const taskCounter = document.getElementById('task-counter');
    const successMessage = document.getElementById('success-message'); // Success message element

    // Load tasks and dark mode preference from localStorage
    loadTasks();
    loadDarkMode();

    addTaskBtn.addEventListener('click', addTask);
    taskList.addEventListener('click', manageTask);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    clearTasksBtn.addEventListener('click', clearTasks);
    authorizeButton.addEventListener('click', handleAuthClick);

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            const li = document.createElement('li');
            const currentDate = new Date().toLocaleString();
            li.innerHTML = `
                <span class="task-info">
                    ${taskText} <span class="task-date">(${currentDate})</span>
                </span>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            `;
            taskList.appendChild(li);
            saveTasks();  // Save tasks to localStorage
            updateTaskCounter();
            taskInput.value = '';

            // Show success message
            showSuccessMessage('Task added successfully!');

            // Add task to Google Calendar
            createCalendarEvent(taskText, currentDate);
        }
    }

    function showSuccessMessage(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');

        // Hide the message after 3 seconds
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 3000);
    }

    function manageTask(e) {
        if (e.target.classList.contains('delete-btn')) {
            e.target.parentElement.remove();
            saveTasks();  // Save tasks after deletion
            updateTaskCounter();
        } else if (e.target.classList.contains('edit-btn')) {
            editTask(e.target.parentElement);
        } else {
            e.target.classList.toggle('completed');
            saveTasks();  // Save tasks after marking as complete/incomplete
        }
    }

    function editTask(taskElement) {
        const taskInfo = taskElement.querySelector('.task-info');
        const taskText = taskInfo.childNodes[0].textContent.trim();
        const newTaskText = prompt('Edit your task:', taskText);
        if (newTaskText !== null && newTaskText.trim() !== '') {
            taskInfo.childNodes[0].textContent = newTaskText;
            saveTasks();  // Save tasks after editing
        }
    }

    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(task => {
            tasks.push({
                text: task.querySelector('.task-info').childNodes[0].textContent.trim(),
                date: task.querySelector('.task-date').textContent,
                completed: task.classList.contains('completed')
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="task-info">
                    ${task.text} <span class="task-date">${task.date}</span>
                </span>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            `;
            if (task.completed) {
                li.classList.add('completed');
            }
            taskList.appendChild(li);
        });
        updateTaskCounter();
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
    }

    function loadDarkMode() {
        const darkModeEnabled = JSON.parse(localStorage.getItem('dark-mode'));
        if (darkModeEnabled) {
            document.body.classList.add('dark-mode');
        }
    }

    function clearTasks() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            taskList.innerHTML = '';
            saveTasks();
            updateTaskCounter();
        }
    }

    function updateTaskCounter() {
        const count = taskList.querySelectorAll('li').length;
        taskCounter.textContent = `Total Tasks: ${count}`;
    }

    function handleClientLoad() {
        gapi.load('client:auth2', initClient);
    }

    function initClient() {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            authorizeButton.disabled = false;
        }, (error) => {
            console.log(JSON.stringify(error, null, 2));
        });
    }

    function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
    }

    function createCalendarEvent(taskText, taskDate) {
        const event = {
            'summary': taskText,
            'description': 'To-Do List Task',
            'start': {
                'dateTime': new Date(taskDate).toISOString(),
                'timeZone': 'America/Los_Angeles'  // Adjust timezone as needed
            },
            'end': {
                'dateTime': new Date(new Date(taskDate).getTime() + 60 * 60 * 1000).toISOString(),
                'timeZone': 'America/Los_Angeles'
            }
        };

        gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        }).then((response) => {
            console.log('Event created: ' + response.htmlLink);
        }).catch((error) => {
            console.log('Error creating event: ' + error);
        });
    }

    // Google Calendar API load
    handleClientLoad();
});

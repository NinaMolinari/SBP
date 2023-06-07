// =================================================================
// FILE: edit_task.js
// .
// =================================================================

gMySavedTasks = [];

document.addEventListener('DOMContentLoaded', function () {
    // Retrieve the task data from local storage
    const selectedTask = JSON.parse(localStorage.getItem('editTask'));

    /*
    var eTask        = selectedTask; //selectedTask;
    // var   bgSavedTasks = eTask.getBgSavedTasks().map();
    var   allSavedTasks = [];
    var   mySavedTasks = [];

    if ( (typeof(localStorage) !== "undefined") && (localStorage.length) ) {
        // (allSavedTasks = localStorage.getItem('bgSavedTasks'));
        (allSavedTasks = localStorage.getItem('savedTasks'));
        console.log(`edit_tasks.js: onDOMloaded: Loaded tasks: ${allSavedTasks.length}`);
    }
    //
    // Parse the task data from JSON string to an array
    gMySavedTasks = JSON.parse(allSavedTasks) || [];

    // Render the task list
    // renderTaskList(); // in popup.js
    console.log(`edit_task.js: onDOMloaded(): Tasks retrieved from local storage: ${gMySavedTasks.length}`);


    // bgTasks.find(state === '6_inEdit')
    // gMySavedTasks.forEach(task => {
    //     if (task.state.includes('Edit')) {
    //         eTask = task;
    //         console.log(`edit_task.js: matched eTask: ${eTask}`);
    //     }
    // });

    if (eTask.id !== selectedTask.id) {
        alert(`Task Edit failed`);
        return false;
    }
    */
    // Populate the form fields with the task data
    document.getElementById('task-name').value        = selectedTask.name;

    //var szDateStr = new Date(eTask.started).toLocaleString('en-US', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });


    document.getElementById('task-start-date').value  = _formatDate2(selectedTask.started); //_formatDate2(eTask.started);
    console.log(`edit_task.js: onDOMloaded: TimeStarted = ${_formatDate2(selectedTask.started)}`);

    chrome.runtime.sendMessage({ type: 'logMessage', message: `edit_task.js: onDOMloaded: TimeStarted = ${_formatDate2(selectedTask.started)}` });

    // new Date(page.lastVisitTime).toLocaleString('en-US', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    // The specified value "6/4/2023, 13:01" does not conform to the required format. The format is "yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS".

    // .toLocaleString("en-US", { day: "2-digit" }).slice(0,10);

    document.getElementById('task-stop-time').value   = _formatDate2(selectedTask.endTime);
    var eHrs = eMins = 0;
    eHrs  = Math.floor(selectedTask.TotalTimeSpent/(1000*60*60));
    eMins = Math.round(selectedTask.TotalTimeSpent/(1000*60));
    console.log(`Hr: ${eHrs}, Min: ${eMins}`);

    document.getElementById('task-total-time-spent-hr').value   = eHrs;
    document.getElementById('task-total-time-spent-min').value  = eMins - (eHrs*60) ;


    //.toLocaleString("en-US", { day: "2-digit" }).slice(0,10);
    /*
    date: new Date().toISOString().slice(0, 10)
    The specified value "1685892405658" does not conform to the required format, "yyyy-MM-dd".
        <label for="task-name">Task Name:</label>
        <input type="text" id="task-name" name="task-name" required><br>

        <label for="task-start-date">Task Started:</label>
        <input type="date" id="task-start-date" name="task-date-started" required><br>

        <label for="task-stop-time">Task Last Stopped:</label>
        <input type="time" id="task-stop-time" name="task-time-stopped" required><br>

        <label for="task-total-time-spent">Total time spent:</label>
        <input type="time" id="task-total-time-spent" name="task-time-spent" required><br>
    */
    // Handle form submission
    document.getElementById('edit-form').addEventListener('submit', function (event) {
      event.preventDefault();

      // Update the task data with the form values
      selectedTask.name = document.getElementById('task-name').value;
      var newStartTime = new Date(document.getElementById('task-start-date').value);
      var newStopTime  = new Date(document.getElementById('task-stop-time').value);
      // var newTimerStart = new Date( '1970-01-01' );
      chrome.runtime.sendMessage({
        type: 'logMessage',
        message: `edit_task.js: onSubmit: NewStart(#7): ${newStartTime}` });
      chrome.runtime.sendMessage({
        type: 'logMessage',
        message: `edit_task.js: onSubmit: NewStopTime(#8): ${newStopTime}` });
      selectedTask.started = newStartTime.getTime();
      // selectedTask.startTime =
      selectedTask.endTime = newStopTime.getTime();

      chrome.runtime.sendMessage({
        type: 'logMessage',
        message: `edit_task.js: onSubmit: TimeSpent(#before-edit): ${selectedTask.TotalTimeSpent}` });

      // var fElapsedHr = fElapsedMin = 0;
      var fElapsedHr  = parseInt(document.getElementById('task-total-time-spent-hr').value, 10);
      var fElapsedMin = parseInt(document.getElementById('task-total-time-spent-min').value,10);
      // const newTimeSpent = (fElapsedHr * 60 * 60 * 1000) + (fElapsedMin * 60 * 1000);
      // chrome.runtime.sendMessage({ type: 'logMessage', message: `edit_task.js: onSubmit: TimeSpent(#2): ${newTimeSpent}` });
      selectedTask.TotalTimeSpent = (fElapsedHr * 60 * 60 * 1000) + (fElapsedMin * 60 * 1000);
      chrome.runtime.sendMessage({ type: 'logMessage',
          message: `edit_task.js: onSubmit: TimeSpent(#After-edit): ${selectedTask.TotalTimeSpent}` });
      // selectedTask.state = '5_mEdited';
      selectedTask.filter_mask = 0x01;

      // TODO: set mask here
      //document.getElementById('task-total-time').checked

      // Save the updated task data back to local storage
      localStorage.setItem('editTask', JSON.stringify(selectedTask));
      // localStorage.setItem('editTask', JSON.stringify(task));

      chrome.runtime.sendMessage({ type: 'updateTask', task: selectedTask})
      // chrome.runtime.sendMessage({ tasks: myTasks });
      // Close the popup window
      setTimeout(function() {
        window.close();
    }, 300 );

    });
});

// ========================================================================
function _formatDate2 (date) {
// ========================================================================
    // console.log(`formatDate:${date}`);
        curYear       = new Date().getFullYear(); //Date(now)  ;// let date =  new Date().getFullYear();
        nDate         = new Date(date);
        const year    = nDate.getFullYear();
        const month   = (nDate.getMonth() + 1).toString().padStart(2, '0');
        const day     = nDate.getDate().toString().padStart(2, '0');
        const hours   = nDate.getHours().toString().padStart(2, '0');
        const minutes = nDate.getMinutes().toString().padStart(2, '0');
        const seconds = nDate.getSeconds().toString().padStart(2, '0');

        //if (year - curYear < 0) {
        return (`${year}-${month}-${day}T${hours}:${minutes}`);
        //The specified value "2023.06.04 13:01" does not conform to the required format, "yyyy-MM-dd".
        //} else {
        //   return (`'${month}/${day} ${hours}:${minutes}`);
        //}
  };

  // Task type mask
  //   0000 000A - A=0 task tracked by timer
  //   0000 000A - A=1 manually edited task
  //   0000 00B0 - B=0 ad-hoc task
  //   0000 00B0 - B=1 planned task
  //

//   const newTask = {
//     id:                  Date.now(),
//     parent_id:           null,
//     agent_id:            'e1056418',
//     name:                taskNameInput.value.trim(),
//     state:               '1_running',   // ' 2_paused, 3_planned, 8_stopped, 9_completed, , 7_scheduled '
//     started:             Date.now(),    // TODO: change to startedDate
//     startTime:           Date.now(),    // TODO: Change to TimerStartTime
//     endTime:             Date.now(),    // TOFO: Change to TimerStopTime
//     TotalTimeSpent:      0,             // NB: used to be elapsedTime
//     resumeCount:         0,
//     plannedDeadline:     null,          // Change: renoved plannedCompleteBy as it is redundant
//     plannedStartTime:    null,
//     plannedTotalTime:    null,
//     estimatedCompletion: null,
//     tags:                null,
//     shortNote:           null
//   };
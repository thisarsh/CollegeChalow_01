document.addEventListener('DOMContentLoaded', () => {
  const subjectForm = document.getElementById('subject-form');
  const subjectsBody = document.querySelector('#subjects tbody');
  const attendanceSummaryBody = document.querySelector('#attendance-summary tbody');
  const subjectDetailSection = document.getElementById('subject-detail');
  const attendanceHistoryBody = document.querySelector('#attendance-history tbody');
  const detailSubjectNameSpan = document.getElementById('detail-subject-name');

  let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
  let selectedSubjectName = null;

  // Create overlay for subject detail popup
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  // Calendar Elements
  const calendarDaysContainer = document.getElementById('calendar-days');
  const currentMonthSpan = document.getElementById('current-month');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const dayDetailsPopup = document.getElementById('day-details-popup');
  const popupDateTitle = document.getElementById('popup-date');
  const popupClassesList = document.getElementById('popup-classes');

  let currentDate = new Date();

  function renderCalendar() {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    currentMonthSpan.textContent = `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
    calendarDaysContainer.innerHTML = '';

    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.classList.add('day', 'empty');
      calendarDaysContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('day');
      dayElement.textContent = day;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      dayElement.addEventListener('click', () => showDayDetails(date));

      if (isToday(date)) {
        dayElement.classList.add('today');
      }
      
      // Check if any subject has attendance on this day
      const formattedDate = formatDate(date);
      let hasAttendance = false;
      
      for (const subject of subjects) {
        if (subject.attendance[formattedDate] && 
            subject.attendance[formattedDate][subject.name] && 
            subject.attendance[formattedDate][subject.name].length > 0) {
          hasAttendance = true;
          break;
        }
      }
      
      if (hasAttendance) {
        const indicator = document.createElement('span');
        indicator.classList.add('day-indicator');
        dayElement.appendChild(indicator);
      }

      calendarDaysContainer.appendChild(dayElement);
    }
  }

  function showDayDetails(date) {
    popupDateTitle.textContent = date.toDateString();
    popupClassesList.innerHTML = ''; // Clear previous classes
    const formattedDate = formatDate(date);

    subjects.forEach(subject => {
      const classItem = document.createElement('div');
      classItem.classList.add('popup-class-item');
      
      // Create subject name element
      const subjectNameEl = document.createElement('div');
      subjectNameEl.classList.add('subject-name');
      subjectNameEl.textContent = subject.name;
      classItem.appendChild(subjectNameEl);
      
      // Get all attendance records for this subject on this date
      const attendanceRecords = subject.attendance[formattedDate]?.[subject.name] || [];
      
      // Count present and absent
      const presentCount = attendanceRecords.filter(status => status === 'present').length;
      const absentCount = attendanceRecords.filter(status => status === 'absent').length;
      
      // Create attendance status display
      const statusDisplay = document.createElement('div');
      statusDisplay.classList.add('attendance-status');
      
      if (attendanceRecords.length === 0) {
        const noStatus = document.createElement('span');
        noStatus.textContent = 'Not Marked';
        statusDisplay.appendChild(noStatus);
      } else {
        if (presentCount > 0) {
          const presentBadge = document.createElement('span');
          presentBadge.classList.add('attendance-count', 'present');
          presentBadge.innerHTML = `<i class="fas fa-check-circle"></i> Present × ${presentCount}`;
          statusDisplay.appendChild(presentBadge);
        }
        
        if (absentCount > 0) {
          const absentBadge = document.createElement('span');
          absentBadge.classList.add('attendance-count', 'absent');
          absentBadge.innerHTML = `<i class="fas fa-times-circle"></i> Absent × ${absentCount}`;
          statusDisplay.appendChild(absentBadge);
        }
      }
      
      classItem.appendChild(statusDisplay);
      
      // Create action buttons
      const actionButtons = document.createElement('div');
      actionButtons.classList.add('action-buttons');
      
      const presentButton = document.createElement('button');
      presentButton.classList.add('present-btn');
      presentButton.innerHTML = '<i class="fas fa-check"></i> Present';
      presentButton.onclick = () => markCalendarAttendance(subject.name, 'present', formattedDate);
      
      const absentButton = document.createElement('button');
      absentButton.classList.add('absent-btn');
      absentButton.innerHTML = '<i class="fas fa-times"></i> Absent';
      absentButton.onclick = () => markCalendarAttendance(subject.name, 'absent', formattedDate);
      
      actionButtons.appendChild(presentButton);
      actionButtons.appendChild(absentButton);
      classItem.appendChild(actionButtons);
      
      popupClassesList.appendChild(classItem);
    });

    dayDetailsPopup.style.display = 'flex'; // Show popup
  }

  function hideDayDetails() {
    dayDetailsPopup.style.display = 'none';
    renderCalendar();
    renderAttendanceSummary();
    renderSubjects();
  }
  window.hideDayDetails = hideDayDetails;

  function markCalendarAttendance(subjectName, status, date) {
    const formattedDate = date;

    const subjectIndex = subjects.findIndex(subject => subject.name === subjectName);
    if (subjectIndex !== -1) {
      const subject = subjects[subjectIndex];
      const attendanceForDate = subject.attendance[formattedDate] || {};
      let subjectAttendanceList = attendanceForDate[subjectName];
      if (!Array.isArray(subjectAttendanceList)) {
        subjectAttendanceList = [];
      }
      subjectAttendanceList.push(status);
      attendanceForDate[subjectName] = subjectAttendanceList;
      subject.attendance[formattedDate] = attendanceForDate;
      subjects[subjectIndex] = subject;
      localStorage.setItem('subjects', JSON.stringify(subjects));
      
      // Refresh the popup with updated data
      showDayDetails(new Date(date));
      renderCalendar();
      renderAttendanceSummary();
      renderSubjects();
    }
  }

  function hasClassesOnDay(date) {
    // Check if any subject has attendance on this day
    const formattedDate = formatDate(date);
    for (const subject of subjects) {
      if (subject.attendance[formattedDate] && 
          subject.attendance[formattedDate][subject.name] && 
          subject.attendance[formattedDate][subject.name].length > 0) {
        return true;
      }
    }
    return false;
  }

  function getMonthName(monthIndex) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthIndex];
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  function formatDate(date) {
    if (!(date instanceof Date)) {
      console.error('formatDate: Argument is NOT a Date object!', date);
      return 'Invalid Date';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Render Subjects Table
  function renderSubjects() {
    subjectsBody.innerHTML = '';
    subjects.forEach((subject, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="#" class="subject-link" data-subject="${subject.name}">${subject.name}</a></td>
        <td>${subject.minAttendance}%</td>
        <td>
          <button class="delete-btn" onclick="deleteSubject(${index})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      `;
      subjectsBody.appendChild(row);
    });
    
    // Add click event listeners to subject links
    document.querySelectorAll('.subject-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const subjectName = e.target.getAttribute('data-subject');
        showSubjectDetailForHistory(subjectName);
      });
    });
    
    renderAttendanceSummary();
    renderCalendar();
  }

  // Render Attendance Summary
  function renderAttendanceSummary() {
    attendanceSummaryBody.innerHTML = '';
    
    subjects.forEach((subject) => {
      let presentCount = 0;
      let absentCount = 0;
      
      for (const date in subject.attendance) {
        const dailyAttendance = subject.attendance[date];
        // Safely get attendanceList, ensure it's an array
        const attendanceList = dailyAttendance[subject.name] || [];
        if (Array.isArray(attendanceList)) {
          presentCount += attendanceList.filter(status => status === 'present').length;
          absentCount += attendanceList.filter(status => status === 'absent').length;
        }
      }
      
      const totalClasses = presentCount + absentCount;
      const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;
      const row = document.createElement('tr');

      const minAttendancePercentage = parseFloat(subject.minAttendance);

      if (percentage < minAttendancePercentage) {
        row.classList.add('low-attendance');
      } else if (percentage >= 90) {
        row.classList.add('very-high-attendance');
      } else if (percentage >= 75) {
        row.classList.add('high-attendance');
      } else {
        row.classList.add('medium-attendance');
      }

      row.innerHTML = `
        <td><a href="#" class="subject-link" data-subject="${subject.name}">${subject.name}</a></td>
        <td>${totalClasses}</td>
        <td>${presentCount}</td>
        <td>${absentCount}</td>
        <td>${percentage}% ${percentage < minAttendancePercentage ? '<i class="fas fa-exclamation-triangle"></i>' : ''}</td>
      `;
      attendanceSummaryBody.appendChild(row);
    });
    
    // Add click event listeners to subject links in summary
    document.querySelectorAll('.attendance-summary .subject-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const subjectName = e.target.getAttribute('data-subject');
        showSubjectDetailForHistory(subjectName);
      });
    });
  }

  // Add Subject
  subjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subjectName = document.getElementById('subject-name').value;
    const minAttendance = document.getElementById('min-attendance').value;

    subjects.push({
      name: subjectName,
      minAttendance: minAttendance,
      attendance: {} // Attendance is now an object/map, date -> {subjectName: status, ...}
    });

    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    subjectForm.reset();
    
    // Show animation for new subject
    const newRow = subjectsBody.lastElementChild;
    if (newRow) {
      newRow.style.animation = 'pulse 0.5s ease';
      setTimeout(() => {
        newRow.style.animation = '';
      }, 500);
    }
  });

  // Delete Subject
  window.deleteSubject = (index) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      subjects.splice(index, 1);
      localStorage.setItem('subjects', JSON.stringify(subjects));
      renderSubjects();
      if (dayDetailsPopup.style.display === 'flex') {
        hideDayDetails();
      }
    }
  };

  // Show Subject Detail - renamed to showSubjectDetailForHistory
  window.showSubjectDetailForHistory = (subjectName) => {
    selectedSubjectName = subjectName;
    detailSubjectNameSpan.textContent = subjectName;
    renderSubjectDetail(subjectName);
    subjectDetailSection.style.display = 'block';
    overlay.style.display = 'block';
    
    // Add animation
    subjectDetailSection.style.animation = 'fadeIn 0.3s ease';
  };

  // Hide Subject Detail
  window.hideSubjectDetail = () => {
    subjectDetailSection.style.display = 'none';
    overlay.style.display = 'none';
    selectedSubjectName = null;
  };

  // Render Subject Detail
  function renderSubjectDetail(subjectName) {
    attendanceHistoryBody.innerHTML = '';
    const subject = subjects.find(subject => subject.name === subjectName);
    
    if (subject) {
      // Group attendance by date
      const attendanceByDate = {};
      
      for (const date in subject.attendance) {
        const dailyAttendance = subject.attendance[date];
        const attendanceList = dailyAttendance[subjectName] || [];
        
        if (attendanceList.length > 0) {
          if (!attendanceByDate[date]) {
            attendanceByDate[date] = { present: 0, absent: 0 };
          }
          
          attendanceList.forEach(status => {
            if (status === 'present') {
              attendanceByDate[date].present++;
            } else if (status === 'absent') {
              attendanceByDate[date].absent++;
            }
          });
        }
      }
      
      // Sort dates in descending order (newest first)
      const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(b) - new Date(a));
      
      sortedDates.forEach(date => {
        const row = document.createElement('tr');
        const displayDate = new Date(date).toLocaleDateString();
        const attendance = attendanceByDate[date];
        
        let attendanceDisplay = '';
        if (attendance.present > 0) {
          attendanceDisplay += `<span class="attendance-count present"><i class="fas fa-check-circle"></i> Present × ${attendance.present}</span>`;
        }
        if (attendance.absent > 0) {
          attendanceDisplay += `<span class="attendance-count absent"><i class="fas fa-times-circle"></i> Absent × ${attendance.absent}</span>`;
        }
        
        row.innerHTML = `
          <td>${displayDate}</td>
          <td>${attendanceDisplay}</td>
          <td>
            <button onclick="removeAttendanceForDate('${subjectName}', '${date}')"><i class="fas fa-trash"></i> Remove All</button>
          </td>
        `;
        attendanceHistoryBody.appendChild(row);
      });
    }
  }

  // Remove All Attendance Records for a Date
  window.removeAttendanceForDate = (subjectName, dateToRemove) => {
    if (confirm(`Are you sure you want to remove all attendance records for ${subjectName} on ${new Date(dateToRemove).toLocaleDateString()}?`)) {
      const subjectIndex = subjects.findIndex(subject => subject.name === subjectName);
      if (subjectIndex !== -1) {
        const dailyAttendance = subjects[subjectIndex].attendance[dateToRemove];
        if (dailyAttendance) {
          delete dailyAttendance[subjectName];
          if (Object.keys(dailyAttendance).length === 0) {
            delete subjects[subjectIndex].attendance[dateToRemove];
          }
          
          localStorage.setItem('subjects', JSON.stringify(subjects));
          renderSubjectDetail(subjectName);
          renderAttendanceSummary();
          renderCalendar();
        }
      }
    }
  };

  // Close subject detail when clicking outside
  overlay.addEventListener('click', () => {
    hideSubjectDetail();
  });

  // Initial Render
  renderSubjects();
  renderCalendar();
});
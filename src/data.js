// Only these two accounts can log in. Demo data only, kept in memory.
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { username: 'student', password: 'student123', role: 'student', name: 'Student' },
];

// Fresh copy of the data for every app instance, so tests never share state.
function createStore() {
  return {
    students: {
      student: {
        marks: [
          { subject: 'Cloud Computing', marks: 42, maxMarks: 50 },
          { subject: 'Operating Systems', marks: 38, maxMarks: 50 },
          { subject: 'Software Testing', marks: 45, maxMarks: 50 },
          { subject: 'Web Technology', marks: 40, maxMarks: 50 },
        ],
        attendance: [
          { subject: 'Cloud Computing', attended: 36, total: 40 },
          { subject: 'Operating Systems', attended: 30, total: 40 },
          { subject: 'Software Testing', attended: 38, total: 40 },
          { subject: 'Web Technology', attended: 34, total: 40 },
        ],
      },
    },
    requests: [],
    nextRequestId: 1,
  };
}

module.exports = { USERS, createStore };

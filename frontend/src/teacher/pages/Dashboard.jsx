export default function Dashboard({
  user,
  classes,
  classesLoading,
  classesError,
  setPage
}) {
  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Welcome back, {user?.name || 'Teacher'}</h1>
          <p>Your classes and students</p>
        </div>
        <button className="t-btn t-btn-tan" onClick={() => setPage('classes')}>
          Manage classes
        </button>
      </div>

      <div className="t-card">
        <div className="t-card-top">
          <h2>Your classes</h2>
          <span className="t-small t-gray">
            {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </span>
        </div>

        {classesLoading && (
          <p>Loading your classes...</p>
        )}

        {classesError && (
          <p role="alert">{classesError}</p>
        )}

        {!classesLoading && !classesError && classes.length === 0 && (
          <div className="t-nothing-here">
            You haven't created a class yet.
            <p>Create a class to get an enrollment code for your students.</p>
            <button className="t-btn t-btn-tan" onClick={() => setPage('classes')}>
              Create your first class
            </button>
          </div>
        )}

        {classes.map((classItem) => (
          <div className="t-row" key={classItem._id}>
            <div className="t-initials">
              {classItem.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="t-row-text">
              <div className="t-row-title">{classItem.name}</div>
              <div className="t-row-subtitle">
                Enrollment code: {classItem.enrollmentCode}
              </div>
            </div>
            <span className="t-small t-gray">
              {classItem.status || 'active'}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
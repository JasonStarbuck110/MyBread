const modules = import.meta.glob('./lesson[0-9]*.js', {
  eager: true,
  import: 'default'
});

export const LESSONS = Object.values(modules)
  .filter(lesson =>
    Number.isInteger(lesson?.id) &&
    Array.isArray(lesson?.screens) &&
    Array.isArray(lesson?.questions)
  )
  .sort((a, b) => a.id - b.id);

export const findLesson = (id) => LESSONS.find(lesson => lesson.id === Number(id));
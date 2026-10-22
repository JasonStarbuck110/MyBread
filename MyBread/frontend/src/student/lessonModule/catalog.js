import lesson1 from './lesson1'
import lesson2 from './lesson2'
import lesson3 from './lesson3'
export const LESSONS = [lesson1, lesson2, lesson3]
export const findLesson = (id) => LESSONS.find(l => l.id === Number(id))

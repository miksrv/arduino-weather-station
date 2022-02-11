import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'

import ru from '../translations/ru.json'
import en from '../translations/en.json'

const availLang = ['ru', 'en']
const VAR_NAME = 'lang'

export const getLanguage = (): string => {
    const browserLang = availLang.filter((item) => navigator.language.includes(item))
    const storeLang = localStorage.getItem(VAR_NAME)

    if (storeLang && availLang.indexOf(storeLang) !== -1)
        return storeLang

    if (browserLang.length)
        return browserLang.pop() as string

    return availLang[0]
}

export const changeLanguage = (lang: string) => {
    if (availLang.indexOf(lang) === -1) return null

    localStorage.setItem(VAR_NAME, lang)
    store.dispatch(setLanguage(translate()))
}

export const translate = () => getLanguage() === 'ru' ? ru : en

export default translate

import { type FormEvent, useEffect, useRef, useState } from 'react';

import type { CalendarEvent } from '@entities/event';

import bossAvatar from '../assets/boss-avatar.png';
import styles from './AiAssistant.module.css';

type AiAssistantProps = {
  events: CalendarEvent[];
  onCreateMeeting: () => void;
  onScheduleWithColleague: (startsAt: Date, colleague: string) => void;
};

type AssistantMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  time: string;
  action?: 'schedule-colleague';
};

const unsolicitedMessages = [
  'Ты тут? Почему не отвечаешь?',
  'Я вижу, что ты открыл календарь. Ответить сложно?',
  'Подтверди, что прочитал. Просто напиши «ок».',
  'Прошло уже несколько секунд. Мне продолжать ждать?',
  'Не игнорируй Босса. У нас вообще-то задачи горят.',
  'У тебя свободное окно в 16:00. Почему там до сих пор нет встречи?',
  'Я повторю: ты тут?',
  'Коллеги ждут. Я жду. Календарь тоже ждёт.',
  'Может, мне самому поставить тебе встречу на всё свободное время?',
  'Ответа всё ещё нет. Очень продуктивно.',
  'Срочно открой чат. Это уже становится неловко.',
  'Последнее напоминание. Хотя нет, я всё равно продолжу писать.'
];

const initialMessages: AssistantMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Здравствуйте! Чем я могу вам помочь?',
    time: getCurrentTime()
  },
  {
    id: 2,
    role: 'assistant',
    text: 'Напишите, что вас интересует, и я обязательно вмешаюсь.',
    time: getCurrentTime()
  }
];

export function AiAssistant({
  events,
  onCreateMeeting,
  onScheduleWithColleague
}: AiAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messageId = useRef(3);
  const responseTimerRef = useRef<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let messageIndex = 0;
    const interval = window.setInterval(() => {
      setMessages((current) => [
        ...current,
        {
          id: messageId.current++,
          role: 'assistant',
          text: unsolicitedMessages[messageIndex++ % unsolicitedMessages.length],
          time: getCurrentTime()
        }
      ]);
      setUnreadCount((current) => current + 1);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setUnreadCount(0);
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking, isOpen]);

  useEffect(
    () => () => {
      if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    },
    []
  );

  const openChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const runScript = (command: string) => {
    const normalizedCommand = command.trim();
    if (!normalizedCommand || isThinking) return;

    setMessages((current) => [
      ...current,
      { id: messageId.current++, role: 'user', text: normalizedCommand, time: getCurrentTime() }
    ]);
    setInput('');
    setIsThinking(true);

    responseTimerRef.current = window.setTimeout(() => {
      const response = resolveScriptedResponse(normalizedCommand, events);
      setMessages((current) => [
        ...current,
        {
          id: messageId.current++,
          role: 'assistant',
          text: response.text,
          time: getCurrentTime(),
          action: response.action
        }
      ]);
      setIsThinking(false);
      if (response.intent === 'create') onCreateMeeting();
    }, 750);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runScript(input);
  };

  const handleScheduleColleague = () => {
    onScheduleWithColleague(nextWeekdayAt(16), 'Алексей Смирнов');
    setMessages((current) => [
      ...current,
      {
        id: messageId.current++,
        role: 'assistant',
        text: 'Готово. Я подготовил встречу на 16:00 и почти всё решил за вас.',
        time: getCurrentTime()
      }
    ]);
  };

  if (!isOpen) {
    return (
      <>
        <div className={styles.attentionOverlay} aria-hidden="true" />
        <div className={styles.notification} role="status">
          <strong>Босс напоминает</strong>
          <span>{messages[messages.length - 1]?.text}</span>
        </div>
        <button
          className={styles.launcher}
          onClick={openChat}
          type="button"
          aria-label="Открыть ассистента"
        >
          <img className={styles.launcherAvatar} src={bossAvatar} alt="" />
          <span className={styles.launcherText}>Есть минутка?</span>
          {unreadCount ? <span className={styles.badge}>{Math.min(unreadCount, 9)}</span> : null}
        </button>
      </>
    );
  }

  return (
    <aside className={styles.root} aria-label="AI-ассистент календаря">
      <button
        className={styles.close}
        onClick={closeChat}
        type="button"
        aria-label="Закрыть чат"
        title="Закрыть"
      >
        ×
      </button>

      <header className={styles.header}>
        <img className={styles.avatar} src={bossAvatar} alt="Босс" />
        <span className={styles.online} aria-label="В сети" />
        <div className={styles.operator}>
          <h2>Босс</h2>
          <p>Всегда следит за календарём</p>
        </div>
        <button
          className={styles.info}
          type="button"
          aria-label="Об ассистенте"
          title="Об ассистенте"
        >
          i
        </button>
      </header>

      <div className={styles.tabs} aria-label="Разделы ассистента">
        <button className={styles.activeTab} type="button">
          <span aria-hidden="true">●</span> Чат
        </button>
        <button onClick={() => runScript('Покажи ближайшие встречи')} type="button">
          <span aria-hidden="true">?</span> Подсказки
        </button>
      </div>

      <div className={styles.chat} ref={chatRef} aria-live="polite">
        <p className={styles.day}>Сегодня</p>
        {messages.map((message) => (
          <div
            className={message.role === 'user' ? styles.userRow : styles.assistantRow}
            key={message.id}
          >
            {message.role === 'assistant' ? (
              <img className={styles.miniAvatar} src={bossAvatar} alt="" />
            ) : null}
            <div className={styles.bubble}>
              {message.text.split('\n').map((line, index) => (
                <span key={`${message.id}-${index}`}>{line}</span>
              ))}
              {message.action === 'schedule-colleague' ? (
                <button
                  className={styles.inlineAction}
                  onClick={handleScheduleColleague}
                  type="button"
                >
                  Забронировать 16:00
                </button>
              ) : null}
              <time>{message.time}</time>
            </div>
          </div>
        ))}
        {isThinking ? (
          <div className={styles.assistantRow}>
            <img className={styles.miniAvatar} src={bossAvatar} alt="" />
            <div className={`${styles.bubble} ${styles.thinking}`} aria-label="Ассистент печатает">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <input
          aria-label="Сообщение ассистенту"
          disabled={isThinking}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ваш вопрос"
          value={input}
        />
        <button
          aria-label="Отправить"
          disabled={!input.trim() || isThinking}
          title="Отправить"
          type="submit"
        >
          →
        </button>
      </form>
    </aside>
  );
}

function resolveScriptedResponse(command: string, events: CalendarEvent[]) {
  const value = command.toLocaleLowerCase('ru');
  if (value.includes('пров') || value.includes('свобод')) {
    return {
      text: 'Проверил календарь Алексея. Ближайший общий слот — завтра с 16:00 до 16:30.',
      action: 'schedule-colleague' as const
    };
  }
  if (value.includes('ближай') || value.includes('распис') || value.includes('покаж')) {
    const upcoming = [...events]
      .filter((event) => new Date(event.endsAt).getTime() >= Date.now())
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .slice(0, 3);
    if (!upcoming.length)
      return { text: 'Ближайших встреч нет. Подозрительно свободный календарь.' };
    return { text: `Вот ближайшие встречи:\n${upcoming.map(formatEventLine).join('\n')}` };
  }
  if (value.includes('созд') || value.includes('добав') || value.includes('встреч')) {
    return { text: 'Уже открываю форму новой встречи.', intent: 'create' as const };
  }
  return {
    text: 'Я пока особенно настойчива в вопросах встреч. Могу создать встречу, показать ближайшие или проверить коллегу.'
  };
}

function formatEventLine(event: CalendarEvent) {
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(event.startsAt));
  return `${date} · ${event.title}`;
}

function nextWeekdayAt(hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function getCurrentTime() {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date()
  );
}

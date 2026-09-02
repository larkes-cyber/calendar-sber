import { type FormEvent, useEffect, useRef, useState } from 'react';

import type { CalendarEvent } from '@entities/event';

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
  action?: 'schedule-colleague';
};

const snippets = [
  { icon: '+', label: 'Создать встречу', command: 'Создай новую встречу' },
  { icon: '≡', label: 'Ближайшие встречи', command: 'Покажи ближайшие встречи' },
  { icon: '✓', label: 'Проверить коллегу', command: 'Проверь, когда свободен Алексей' }
];

const initialMessages: AssistantMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Здравствуйте! Я помогу спланировать встречу и быстро проверить расписание.'
  }
];

export function AiAssistant({ events, onCreateMeeting, onScheduleWithColleague }: AiAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messageId = useRef(2);
  const timerRef = useRef<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  const runScript = (command: string) => {
    const normalizedCommand = command.trim();
    if (!normalizedCommand || isThinking) return;

    setMessages((current) => [
      ...current,
      { id: messageId.current++, role: 'user', text: normalizedCommand }
    ]);
    setInput('');
    setIsThinking(true);

    timerRef.current = window.setTimeout(() => {
      const response = resolveScriptedResponse(normalizedCommand, events);
      setMessages((current) => [
        ...current,
        { id: messageId.current++, role: 'assistant', text: response.text, action: response.action }
      ]);
      setIsThinking(false);

      if (response.intent === 'create') onCreateMeeting();
    }, 650);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runScript(input);
  };

  const handleScheduleColleague = () => {
    const startsAt = nextWeekdayAt(16);
    onScheduleWithColleague(startsAt, 'Алексей Смирнов');
    setMessages((current) => [
      ...current,
      {
        id: messageId.current++,
        role: 'assistant',
        text: 'Подготовил встречу с Алексеем на ближайший свободный слот. Осталось проверить детали.'
      }
    ]);
  };

  return (
    <aside className={styles.root} aria-label="AI-ассистент календаря">
      <div className={styles.header}>
        <div className={styles.mark}>AI</div>
        <div>
          <h2>Ассистент</h2>
          <span><i /> На связи</span>
        </div>
      </div>

      <div className={styles.snippets} aria-label="Быстрые команды">
        <p>Быстрые действия</p>
        {snippets.map((snippet) => (
          <button
            disabled={isThinking}
            key={snippet.label}
            onClick={() => runScript(snippet.command)}
            type="button"
          >
            <span aria-hidden="true">{snippet.icon}</span>
            {snippet.label}
          </button>
        ))}
      </div>

      <div className={styles.chat} ref={chatRef} aria-live="polite">
        <div className={styles.dateDivider}><span>Сегодня</span></div>
        {messages.map((message) => (
          <div className={message.role === 'user' ? styles.userRow : styles.assistantRow} key={message.id}>
            <div className={styles.bubble}>
              {message.text.split('\n').map((line, index) => <span key={`${message.id}-${index}`}>{line}</span>)}
              {message.action === 'schedule-colleague' ? (
                <button className={styles.inlineAction} onClick={handleScheduleColleague} type="button">
                  Создать на 16:00
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {isThinking ? (
          <div className={styles.assistantRow}>
            <div className={`${styles.bubble} ${styles.thinking}`} aria-label="Ассистент печатает">
              <i /><i /><i />
            </div>
          </div>
        ) : null}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <input
          aria-label="Сообщение ассистенту"
          disabled={isThinking}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Напишите задачу..."
          value={input}
        />
        <button aria-label="Отправить" disabled={!input.trim() || isThinking} title="Отправить" type="submit">
          ↑
        </button>
      </form>
      <p className={styles.disclaimer}>Демонстрационный режим</p>
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

    if (!upcoming.length) return { text: 'Ближайших встреч в календаре нет.' };

    return {
      text: `Вот ближайшие встречи:\n${upcoming.map(formatEventLine).join('\n')}`
    };
  }

  if (value.includes('созд') || value.includes('добав') || value.includes('встреч')) {
    return {
      text: 'Открываю форму новой встречи. Я уже выбрал ближайший рабочий час.',
      intent: 'create' as const
    };
  }

  return {
    text: 'Я пока работаю со встречами. Попробуйте попросить создать встречу, показать ближайшие или проверить свободное время коллеги.'
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

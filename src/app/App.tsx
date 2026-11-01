import { Counter } from '../features/counter/Counter.tsx';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.main}>
      <h1>Software Factory</h1>
      <p>Your app starts here. Run /feature to build the first story.</p>
      <Counter />
    </main>
  );
}

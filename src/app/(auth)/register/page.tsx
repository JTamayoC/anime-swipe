import { signup } from '../login/actions';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <form className="flex flex-col gap-2 w-80" action={signup}>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required className="border rounded px-2 py-1" />
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="border rounded px-2 py-1"
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2 mt-2 hover:bg-blue-700 transition-colors">
          Sign up
        </button>
      </form>
      <a href="/login" className="text-blue-600 hover:underline">
        Already have an account? Log in
      </a>
    </div>
  );
}

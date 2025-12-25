import { create } from 'zustand';

export const useStore = create((set) => ({
  username: localStorage.getItem('username') || '', // Recuperar si existe
  roomId: null,
  isHost: false, // Saber si yo creé la sala
  
  setUsername: (name) => {
    localStorage.setItem('username', name);
    set({ username: name });
  },
  setRoomId: (id) => set({ roomId: id }),
  setIsHost: (val) => set({ isHost: val }),
}));
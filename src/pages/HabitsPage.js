import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


const HabitsList = () => {
  const [habits, setHabits] = useState([]);
  const [habitsDone, setHabitsDone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [sumExp, setSumExp] = useState(0);
  const [streak, setStreak] = useState({});
  const [idChangeHabit, setIdChangeHabit] = useState()
  const navigate = useNavigate();
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
  });

  // Получение списка привычек
  useEffect(() => {
    
    fetchHabits();
    fetchHabitsDone();
    fetchSumExp();
  }, []);

  const exit = () => {
    localStorage.clear();
    navigate('/login'); 
  }

  const fetchHabitsDone = async () => {
    try {
      const token = localStorage.getItem('token');
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:8080/api/habits/completed/${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки привычек');
      
      const data = await response.json();
      const ids = data.map(item => item.id);
      setHabitsDone(ids);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  

  const fetchSumExp = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/habits/sum_exp`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки привычек');
      
      const exp = await response.text();
      setSumExp(exp);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/habits/streak/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Ошибка загрузки стрика');
      return await response.text();
    } catch (err) {
      console.error('Error fetching streak:', err);
      return "0"; // Возвращаем "0" при ошибке
    }
  }, []);

  const fetchHabits = async () => {
    try {
      //setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/habits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки привычек');
      
      const data = await response.json();
      
      //Добавляем streaks ко всем привычкам
      const habitsWithStreaks = await Promise.all(
        data.map(async item => ({
          ...item,
          streak: await calculateStreak(item.id)
        }))
      );
      
      setHabits(habitsWithStreaks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление привычки
  const deleteHabit = async(id) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/habits/${id}`, {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newHabit)
        });
        await fetchHabits();
    } catch(err) {
        setError(err.message);
    }
  }


  

  const openChangeModal = (habit) => {
    setIdChangeHabit(habit.id)
    setNewHabit({
      title: habit.title,
      description: habit.description,
      category: habit.category,
      difficulty: habit.difficulty,
    });
    setShowChangeModal(true);
    setError(null);
  };

  const closeChangeModal = () => {
    setIdChangeHabit(null)
    setShowChangeModal(false);
    setNewHabit({
      title: '',
      description: '',
      category: '',
      difficulty: 'medium',
    });
  };



const doneHabit = async (e, habitId) => {
  const isChecked = e.target.checked;
  
  try {
    if(isChecked) {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
      });
      
      if (!response.ok) throw new Error('Ошибка обновления');
    } else {
      const token = localStorage.getItem('token');
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:8080/api/habits/${habitId}/${date}/uncomplete`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
      });
      
      if (!response.ok) throw new Error('Ошибка обновления');
      
    }
    
    
    // Локально обновляем состояние без дополнительного запроса
    setHabitsDone(prev => {
      if (isChecked) {
        return [...prev, habitId];
      } else {
        return prev.filter(id => id !== habitId); 
      }
    });

    fetchHabits();
    fetchSumExp();
    
  } catch (error) {
    console.error("Ошибка:", error);
    e.target.checked = !isChecked; 
  }
};

const unDoneHabit = async (e, habitId) => {
  const isChecked = e.target.checked;
  
  try {
    
    
    // Локально обновляем состояние без дополнительного запроса
    setHabitsDone(prev => {
      if (isChecked) {
        return [...prev, habitId]; // Добавляем ID
      } else {
        return prev.filter(id => id !== habitId); // Удаляем ID
      }
    });
    
    // Если нужно обновить другие данные
    fetchHabits();
    
  } catch (error) {
    console.error("Ошибка:", error);
    // Можно добавить откат состояния, если запрос не прошел
    e.target.checked = !isChecked; // Возвращаем чекбокс в предыдущее состояние
  }
};

  // Обработчик добавления привычки
  const handleAddHabit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHabit)
      });

      if (!response.ok) throw new Error('Ошибка создания привычки');

      await fetchHabits();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Обработчик изменения привычки
  const handleChangeHabit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/habits/change_habit/${idChangeHabit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHabit)
      });

      if (!response.ok) throw new Error('Ошибка изменения привычки');

      await fetchHabits();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHabit(prev => ({ ...prev, [name]: value }));
  };

  const openModal = () => {
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewHabit({
      title: '',
      description: '',
      category: '',
      difficulty: 'medium',
    });
  };

  function HabitItem({ habit, onToggle }) {
  const handleChange = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHabit)
      });

      if (!response.ok) throw new Error('Ошибка создания привычки');

      await fetchHabits();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <div className="habits-container">
      <div className="habits-header">
        <h2>{localStorage.getItem('name')}</h2>
        <p>Опыт: {sumExp}</p>
        <button onClick={exit} className="del-habit-btn">
          Выйти
        </button>
      </div>
      <div className="habits-header">
        <h2>Мои привычки</h2>
        <button onClick={openModal} className="add-habit-btn">
          + Добавить привычку
        </button>
      </div>

      {/* Модальное окно добавить */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Добавить новую привычку</h3>
              <button onClick={closeModal} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleAddHabit} className="habit-form">
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-group">
                <label>Название*</label>
                <input
                  type="text"
                  name="title"
                  value={newHabit.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={newHabit.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Категория*</label>
                  <input
                    type="text"
                    name="category"
                    value={newHabit.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Сложность</label>
                  <select
                    name="difficulty"
                    value={newHabit.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="easy">Легкая</option>
                    <option value="medium">Средняя</option>
                    <option value="hard">Сложная</option>
                  </select>
                </div>
              </div>


              <div className="form-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Отмена
                </button>
                <button type="submit" className="submit-btn">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Модальное окно изменить */}
      {showChangeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Изменить привычку</h3>
              <button onClick={closeChangeModal} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleChangeHabit} className="habit-form">
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-group">
                <label>Название*</label>
                <input
                  type="text"
                  name="title"
                  value={newHabit.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={newHabit.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Категория*</label>
                  <input
                    type="text"
                    name="category"
                    value={newHabit.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Сложность</label>
                  <select
                    name="difficulty"
                    value={newHabit.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="easy">Легкая</option>
                    <option value="medium">Средняя</option>
                    <option value="hard">Сложная</option>
                  </select>
                </div>
              </div>


              <div className="form-actions">
                <button type="button" onClick={closeChangeModal} className="cancel-btn">
                  Отмена
                </button>
                <button type="submit" className="submit-btn">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* Таблица привычек */}
      <div className="table-container">
        <table className="habits-table">
          <thead>
            <tr>
                <th></th>
              <th>Название</th>
              <th>Описание</th>
              <th>Категория</th>
              <th>Сложность</th>
              <th>Стрик</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id}>
                <td>
                    <input type="checkbox" id="scales" name="scales" onChange={(e) => doneHabit(e, habit.id)} checked={habitsDone.includes(habit.id)}/>
                </td>
                <td>{habit.title}</td>
                <td>{habit.description}</td>
                <td>{habit.category}</td>
                <td>{habit.difficulty}</td>
                <td>
                    {habit.streak}
                </td>
                <td>
                    <buttom onClick={() => deleteHabit(habit.id)} className="del-habit-btn">удалить</buttom>
                    <buttom onClick={() => openChangeModal(habit)} className="add-habit-btn">изменить</buttom>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HabitsList;
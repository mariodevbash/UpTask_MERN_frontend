import { useState, useEffect, createContext } from "react";
import axiosClient from "../config/axiosClient";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import io from "socket.io-client";
let socket;

const ProjectsContext = createContext();

const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [alert, setAlert] = useState({});
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(false);
  const [taskFormModal, setTaskFormModal] = useState(false);
  const [deleteTaskModal, setDeleteTaskModal] = useState(false);
  const [task, setTask] = useState({});
  const [collaborator, setCollaborator] = useState({});
  const [deleteCollaboratorModal, setDeleteCollaboratorModal] = useState(false);
  const [search, setSearch] = useState(false);

  const navigate = useNavigate();
  const { auth } = useAuth();

  useEffect(() => {
    const getProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const { data } = await axiosClient("/proyectos", config);
        setProjects(data);
      } catch (error) {
        console.log(error);
      }
    };

    getProjects();
  }, [auth]);

  useEffect(() => {
    socket = io(import.meta.env.VITE_BACKEND_URL);
  }, []);

  const showAlert = (alert) => {
    setAlert(alert);

    setTimeout(() => {
      setAlert({});
    }, 4000);
  };

  const submitProject = async (project) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      //Nuevo Proyecto
      if (!project.id) {
        const { data } = await axiosClient.post("/proyectos", project, config);
        setProjects([...projects, data]);

        setAlert({
          msg: "Proyecto Creado Correctamente",
          error: false,
        });
      } else {
        //Actualizar Proyecto
        const { data } = await axiosClient.put(
          `/proyectos/${project.id}`,
          project,
          config
        );

        const updatedProjects = projects.map((projectState) =>
          projectState._id === data._id ? data : projectState
        );
        setProjects(updatedProjects);

        setAlert({
          msg: "Proyecto Actualizado Correctamente",
          error: false,
        });
      }

      setTimeout(() => {
        setAlert({});
        navigate("/projects");
      }, 3000);
    } catch (error) {
      console.log(error);
    }
  };

  const getProject = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient(`/proyectos/${id}`, config);
      setProject(data);
      setAlert({});
    } catch (error) {
      navigate("/projects");
      setAlert({
        msg: error.response.data.msg,
        error: true,
      });
      setTimeout(() => {
        setAlert({});
        navigate("/projects");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.delete(`/proyectos/${id}`, config);

      const updatedProjects = projects.filter(
        (projectState) => projectState._id !== id
      );
      setProjects(updatedProjects);

      setAlert({
        msg: data.msg,
        error: false,
      });

      setTimeout(() => {
        setAlert({});
        navigate("/projects");
      }, 3000);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTaskModal = () => {
    setTaskFormModal(!taskFormModal);
    setTask({});
  };

  const submitTask = async (task) => {
    if (task?.id) {
      await editTask(task);
    } else {
      await createTask(task);
    }
  };

  const createTask = async (task) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.post("/tareas", task, config);

      setAlert({});
      setTaskFormModal(false);

      //SOCKET IO
      socket.emit("nueva tarea", data);
    } catch (error) {
      console.log(error);
    }
  };

  const editTask = async (task) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.put(
        `/tareas/${task.id}`,
        task,
        config
      );

      socket.emit("editar tarea", data);

      setAlert({});
      setTaskFormModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditTask = (task) => {
    setTask(task);
    setTaskFormModal(true);
  };

  const handleDeleteTaskModal = (task) => {
    setTask(task);
    setDeleteTaskModal(!deleteTaskModal);
  };

  const deleteTask = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.delete(`/tareas/${task._id}`, config);

      setAlert({
        msg: data.msg,
        error: false,
      });

      setDeleteTaskModal(false);

      //SOCKET
      socket.emit("eliminar tarea", task);

      setTimeout(() => {
        setAlert({});
      }, 3000);
      setTask({});
    } catch (error) {
      console.log(error);
    }
  };

  const submitCollaborator = async (email) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.post(
        "/proyectos/colaboradores",
        { email },
        config
      );

      setCollaborator(data);
      setAlert({});
    } catch (error) {
      setAlert({
        msg: error.response.data.msg,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = async (email) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.post(
        `/proyectos/colaboradores/${project._id}`,
        email,
        config
      );

      setAlert({
        msg: data.msg,
        error: false,
      });
      setCollaborator({});

      setTimeout(() => {
        setAlert({});
      }, 3000);
    } catch (error) {
      setAlert({
        msg: error.response.data.msg,
        error: true,
      });
    }
  };

  const handleDeleteCollaboratorModal = (collaborator) => {
    setDeleteCollaboratorModal(!deleteCollaboratorModal);
    setCollaborator(collaborator);
  };

  const deleteCollaborator = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axiosClient.post(
        `/proyectos/eliminar-colaborador/${project._id}`,
        { id: collaborator._id },
        config
      );

      const updatedProject = { ...project };
      updatedProject.colaboradores = updatedProject.colaboradores.filter(
        (collaboratorState) => collaboratorState._id !== collaborator._id
      );
      setProject(updatedProject);

      setAlert({
        msg: data.msg,
        error: false,
      });
      setDeleteCollaboratorModal(false);
      setTimeout(() => {
        setAlert({});
      }, 3000);
    } catch (error) {
      console.log(error.response);
    }
  };

  const completeTask = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axiosClient.post(
        `/tareas/estado/${id}`,
        {},
        config
      );

      socket.emit("completar tarea", data);

      setAlert({});
      setTask({});
    } catch (error) {
      console.log(error.response);
    }
  };

  const handleSearch = () => {
    setSearch(!search);
  };

  const submitTareasProyecto = (tarea) => {
    //Agrega la tarea al state
    const updatedProject = { ...project };
    updatedProject.tareas = [...updatedProject.tareas, tarea];

    setProject(updatedProject);
  };

  const eliminarTareaProyecto = (task) => {
    //Eliminar tarea del state
    const updatedProject = { ...project };
    updatedProject.tareas = updatedProject.tareas.filter(
      (taskState) => taskState._id !== task._id
    );

    setProject(updatedProject);
  };

  const editarTareaProyecto = (tarea) => {
    //Editar Tarea del state
    //TODO: Actualizar DOM
    const updatedProject = { ...project };
    updatedProject.tareas = updatedProject.tareas.map((taskState) =>
      taskState._id === tarea._id ? tarea : taskState
    );
    setProject(updatedProject);
  };

  const cambiarEstadoTarea = (tarea) => {
    const updatedProject = { ...project };
    updatedProject.tareas = updatedProject.tareas.map((tareaState) =>
      tareaState._id === tarea._id ? tarea : tareaState
    );
    setProject(updatedProject);
  };

  const cerrarSesionProyectos = () => {
    setProject({});
    setProjects({});
    setAlert({});
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        alert,
        showAlert,
        submitProject,
        getProject,
        project,
        loading,
        deleteProject,
        taskFormModal,
        handleTaskModal,
        submitTask,
        handleEditTask,
        task,
        deleteTaskModal,
        handleDeleteTaskModal,
        deleteTask,
        submitCollaborator,
        collaborator,
        addCollaborator,
        handleDeleteCollaboratorModal,
        deleteCollaboratorModal,
        deleteCollaborator,
        completeTask,
        handleSearch,
        search,
        submitTareasProyecto,
        eliminarTareaProyecto,
        editarTareaProyecto,
        cambiarEstadoTarea,
        cerrarSesionProyectos,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export { ProjectsProvider };

export default ProjectsContext;

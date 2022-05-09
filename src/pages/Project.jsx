import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useProjects from "../hooks/useProjects";
import useAdmin from "../hooks/useAdmin";
import TaskFormModal from "../components/TaskFormModal";
import DeleteTaskModal from "../components/DeleteTaskModal";
import DeleteCollaboratorModal from "../components/DeleteCollaboratorModal";
import Task from "../components/Task";
import Alert from "../components/Alert";
import Collaborator from "../components/Collaborator";
import io from "socket.io-client";

let socket;

const Project = () => {
  const params = useParams();
  const {
    getProject,
    project,
    loading,
    handleTaskModal,
    alert,
    submitTareasProyecto,
    eliminarTareaProyecto,
    editarTareaProyecto,
    cambiarEstadoTarea,
  } = useProjects();

  const admin = useAdmin();

  useEffect(() => {
    getProject(params.id);
  }, []);

  useEffect(() => {
    socket = io(import.meta.env.VITE_BACKEND_URL);
    socket.emit("abrir proyecto", params.id);
  }, []);

  useEffect(() => {
    socket.on("tarea agregada", (tareaNueva) => {
      if (tareaNueva.proyecto === project._id) {
        submitTareasProyecto(tareaNueva);
      }
    });

    socket.on("tarea eliminada", (tareaEliminada) => {
      if (tareaEliminada.proyecto === project._id) {
        eliminarTareaProyecto(tareaEliminada);
      }
    });

    socket.on("tarea editada", (tareaEditada) => {
      if (tareaEditada.proyecto._id === project._id) {
        editarTareaProyecto(tareaEditada);
      }
    });

    socket.on("tarea completada", (tareaCompletada) => {
      if (tareaCompletada.proyecto._id === project._id) {
        cambiarEstadoTarea(tareaCompletada)
      }
    });
  });

  const { nombre } = project;

  if (loading) return "...";

  const { msg } = alert;

  return (
    <>
      <div className="flex justify-between">
        <h1 className="font-black text-4xl">{nombre}</h1>
        {admin && (
          <div className="flex item-center gap-2 text-gray-400 hover:text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <Link
              to={`/projects/edit/${params.id}`}
              className="uppercase font-bold"
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      {admin && (
        <button
          type="button"
          className="text-sm px-5 py-3 w-full md:w-auto rounded-lg uppercase font-bold bg-sky-400 text-white text-center mt-5 flex gap-2 items-center justify-center"
          onClick={handleTaskModal}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Nueva Tarea
        </button>
      )}

      <p className="font-bold text-xl mt-10">Tareas del Proyecto</p>

      <div className="bg-white shadow mt-10 rounded-lg">
        {project.tareas?.length ? (
          project.tareas?.map((tarea) => <Task key={tarea._id} tarea={tarea} />)
        ) : (
          <p className="text-center my-5 p-10">
            No hay tareas en este proyecto
          </p>
        )}
      </div>

      {admin && (
        <>
          <div className="flex items-center justify-between mt-10">
            <p className="font-bold text-xl">Colaboradores</p>
            <Link
              to={`/projects/new-collaborator/${project._id}`}
              className="text-gray-400 hover:text-black uppercase font-bold"
            >
              Añadir
            </Link>
          </div>

          <div className="bg-white shadow mt-10 rounded-lg">
            {project.colaboradores?.length ? (
              project.colaboradores?.map((colaborador) => (
                <Collaborator key={colaborador._id} colaborador={colaborador} />
              ))
            ) : (
              <p className="text-center my-5 p-10">
                No hay colaboradores en este proyecto
              </p>
            )}
          </div>
        </>
      )}

      <TaskFormModal />
      <DeleteTaskModal />
      <DeleteCollaboratorModal />
    </>
  );
};

export default Project;

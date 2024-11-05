export class User {
	rol: string;
	id: string;
	nombre: string;
	apellido: string;
	edad: number;
	dni: number;
	imgUrl1: string;
	imgUrl2: string;
	email: string;
	contrasena: string;

	constructor(rol: string, id: string = '', nombre: string, apellido: string, edad: number, dni: number, imgUrl1: string, imgUrl2: string, email: string, contrasena: string) {
		this.rol = rol;
		this.id = id;
		this.nombre = nombre;
		this.apellido = apellido;
		this.edad = edad;
		this.dni = dni;
		this.imgUrl1 = imgUrl1;
		this.imgUrl2 = imgUrl2;
		this.email = email;
		this.contrasena = contrasena;
	}
}
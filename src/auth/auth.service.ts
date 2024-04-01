import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async register(user: RegisterAuthDto) {
    const { email, phone } = user;
    const emailExist = await this.usersRepository.findOneBy({
      email: email,
    });
    if (emailExist) {
      return new HttpException(
        'El email ya esta registrado',
        HttpStatus.CONFLICT,
      );
    }

    const phoneExist = await this.usersRepository.findOneBy({
      phone: phone,
    });
    if (phoneExist) {
      return new HttpException(
        'El telefono ya esta registrado',
        HttpStatus.CONFLICT,
      );
    }
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const userFound = await this.usersRepository.findOneBy({
      email: email,
    });
    if (!userFound) {
      return new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }
    const isPasswordValid = await compare(password, userFound.password);
    if (!isPasswordValid) {
      return new HttpException(
        'La contraseña es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }
    return userFound;
  }
}

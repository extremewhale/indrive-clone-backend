import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import storage from '../utils/cloud_storage';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  create(user: CreateUserDto) {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }
  findAll() {
    return this.usersRepository.find({ relations: ['roles'] });
  }
  findById(id: number) {
    const userFound = this.usersRepository.findOneBy({ id: id });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    return userFound;
  }
  async updateToken(id: number, token: string) {
    const userFound = await this.usersRepository.findOneBy({
      id: id,
    });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    const user = userFound;
    user.notification_token = token;
    const updateUser = Object.assign(userFound, user);
    return this.usersRepository.save(updateUser);
  }
  async update(id: number, user: UpdateUserDto) {
    const userFound = await this.usersRepository.findOneBy({
      id: id,
    });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    const updateUser = Object.assign(userFound, user);
    return this.usersRepository.save(updateUser);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateWithImage(
    file: Express.Multer.File,
    id: number,
    user: UpdateUserDto,
  ) {
    const url = await storage(file, file.originalname);
    console.log('URL : ' + url);
    if (url === undefined && url === null) {
      throw new HttpException(
        'La imagen no se pudo guardar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    user.image = url;
    const userFound = await this.usersRepository.findOneBy({
      id: id,
    });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    const updateUser = Object.assign(userFound, user);
    return this.usersRepository.save(updateUser);
  }
}

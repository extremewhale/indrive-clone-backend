import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TimeAndDistanceValuesService } from '../time_and_distance_values/time_and_distance_values.service';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientRequests, Status } from './client_requests.entity';
import { Repository } from 'typeorm';
import { CreateClientRequestDto } from './dto/create_client_request.dto';
const API_KEY = 'AIzaSyCC7qggQbcyfEIH9Ij4IyDgqSFaAYixnog';

@Injectable()
export class ClientRequestsService extends Client {
  constructor(
    @InjectRepository(ClientRequests)
    private clientRequestsRepository: Repository<ClientRequests>,
    private timeAndDistanceValuesService: TimeAndDistanceValuesService,
  ) {
    super();
  }

  async create(clientRequest: CreateClientRequestDto) {
    try {
      await this.clientRequestsRepository.query(`
            INSERT INTO
                client_requests(
                    id_client,
                    fare_offered,
                    pickup_description,
                    destination_description,
                    pickup_position,
                    destination_position
                )
            VALUES(
                ${clientRequest.id_client},
                ${clientRequest.fare_offered},
                '${clientRequest.pickup_description}',
                '${clientRequest.destination_description}',
                ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326),
                ST_GeomFromText('POINT(${clientRequest.destination_lat} ${clientRequest.destination_lng})', 4326)
            )
        `);
      return true;
      // const data = await this.clientRequestsRepository.query(
      //   `SELECT MAX(id) AS id FROM client_requests`,
      // );
      // const nearbyDrivers = await this.clientRequestsRepository.query(`
      //   SELECT
      //       U.id,
      //       U.name,
      //       U.notification_token,
      //       DP.position,
      //       ST_Distance_Sphere(DP.position, ST_GeomFromText('POINT(${clientRequest.pickup_lat} ${clientRequest.pickup_lng})', 4326)) AS distance
      //   FROM
      //       users AS U
      //   LEFT JOIN
      //       drivers_position AS DP
      //   ON
      //       U.id = DP.id_driver
      //   HAVING
      //       distance < 10000
      //   `);
      // const notificationTokens = [];

      // nearbyDrivers.forEach((driver, index) => {
      //   if (!notificationTokens.includes(driver.notification_token)) {
      //     if (driver.notification_token !== '') {
      //       notificationTokens.push(driver.notification_token);
      //     }
      //   }
      // });
      // console.log('NOTIFICATION TOKEN:', notificationTokens);

      // this.firebaseRepository.sendMessageToMultipleDevices({
      //   tokens: notificationTokens,
      //   notification: {
      //     title: 'Solicitud de viaje',
      //     body: clientRequest.pickup_description,
      //   },
      //   data: {
      //     id_client_requets: `${data[0].id}`,
      //     type: 'CLIENT_REQUEST',
      //   },
      //   android: {
      //     priority: 'high',
      //     ttl: 180,
      //   },
      //   apns: {
      //     headers: {
      //       'apns-priority': '5',
      //       'apns-expiration': '180',
      //     },
      //   },
      // });
      //return Number(data[0].id);
    } catch (error) {
      console.log('Error creando la solicitud del cliente', error);
      throw new HttpException(
        'Error del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTimeAndDistanceClientRequest(
    origin_lat: number,
    origin_lng: number,
    destination_lat: number,
    destination_lng: number,
  ) {
    const values = await this.timeAndDistanceValuesService.find();
    const kmValue = values[0].km_value;
    const minValue = values[0].min_value;
    console.log('valores-------');
    console.log(values);
    const googleResponse = await this.distancematrix({
      params: {
        mode: TravelMode.driving,
        key: API_KEY,
        origins: [
          {
            lat: origin_lat,
            lng: origin_lng,
          },
        ],
        destinations: [
          {
            lat: destination_lat,
            lng: destination_lng,
          },
        ],
      },
    });
    const recommendedValue =
      kmValue *
        (googleResponse.data.rows[0].elements[0].distance.value / 1000) +
      minValue * (googleResponse.data.rows[0].elements[0].duration.value / 60);
    const roundedRecommendedValue = parseFloat(recommendedValue.toFixed(2));
    const roundedDistanceValue = parseFloat(
      (googleResponse.data.rows[0].elements[0].distance.value / 1000).toFixed(
        2,
      ),
    );
    const roundedDurationValue = parseFloat(
      (googleResponse.data.rows[0].elements[0].duration.value / 60).toFixed(2),
    );
    return {
      recommended_value: roundedRecommendedValue,
      destination_addresses: googleResponse.data.destination_addresses[0],
      origin_addresses: googleResponse.data.origin_addresses[0],
      distance: {
        text: googleResponse.data.rows[0].elements[0].distance.text,
        value: roundedDistanceValue,
      },
      duration: {
        text: googleResponse.data.rows[0].elements[0].duration.text,
        value: roundedDurationValue,
      },
    };
  }

  async getNearbyTripRequest(driver_lat: number, driver_lng: number) {
    const data = await this.clientRequestsRepository.query(`
    SELECT
        CR.id,
        CR.id_client,
        CR.fare_offered,
        CR.pickup_description,
        CR.destination_description,
        CR.status,
        CR.updated_at,
        CR.pickup_position,
        CR.destination_position,
        ST_Distance_Sphere(pickup_position, ST_GeomFromText('POINT(${driver_lat} ${driver_lng})', 4326)) AS distance,
        timestampdiff(MINUTE, CR.updated_at, NOW()) AS time_difference,
    JSON_OBJECT(
        "name", U.name,
        "lastname", U.lastname,
        "phone", U.phone,
        "image", U.image
    ) AS client
    FROM 
        client_requests AS CR
    INNER JOIN
        users AS U
    ON
        U.id = CR.id_client
    WHERE
        timestampdiff(MINUTE, CR.updated_at, NOW()) < 5000 AND CR.status = '${Status.CREATED}'
    HAVING
        distance < 10000
    `);
    if (data.length > 0) {
      const pickup_positions = data.map((d) => ({
        lat: d.pickup_position.y,
        lng: d.pickup_position.x,
      }));

      const googleResponse = await this.distancematrix({
        params: {
          mode: TravelMode.driving,
          key: API_KEY,
          origins: [
            {
              lat: driver_lat,
              lng: driver_lng,
            },
          ],
          destinations: pickup_positions,
        },
      });

      data.forEach((d, index) => {
        d.google_distance_matrix = googleResponse.data.rows[0].elements[index];
      });
    }
    return data;
  }
}

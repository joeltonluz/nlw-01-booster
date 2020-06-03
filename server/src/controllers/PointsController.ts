import { Request, Response } from 'express';
import knex from '../database/connection';
import ItemsController from './ItemsController';

class PointsController {
  async index (req: Request, res: Response) {
    const { city, uf, items} = req.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('points_items','points.id', '=', 'points_items.point_id')
      .whereIn('points_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    return res.json(points);
  };
  async show (req: Request, res: Response) {
    const { id } = req.params;

    const trx = await knex.transaction();

    const point = await trx('points').where('id', id).first();

    if (!point) {
      return res.status(400).json({message: 'Ponto de Coleta NÃO Encontrado.'});
    };

    const items = await trx('items')
      .join('points_items', 'items.id', '=', 'points_items.item_id')
      .where('points_items.point_id',id)
      .select('items.title');

    await trx.commit();

    return res.json({ point, items});
  };
  async create (req: Request, res: Response) {
    const { 
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
     } = req.body;
  
    const trx = await knex.transaction();
  
    const point = {
      image: 'https://images.unsplash.com/photo-1556767576-5ec41e3239ea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf
    };

    const insertedIds = await trx('points').insert(point);
  
    const point_id = insertedIds[0];
  
    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id: point_id,
      };
    });
  
    await trx('points_items').insert(pointItems);

    await trx.commit();
  
    return res.json({
      id: point_id,
      ...point,
    });
  };
};

export default PointsController;
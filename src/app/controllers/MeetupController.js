import * as Yup from 'yup';

import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  /**
   * Crie uma rota para listar os meetups com filtro por data (não por hora),
   * os resultados dessa listagem devem vir paginados em 10 itens por página.
   * Abaixo tem um exemplo de chamada para a rota de listagem dos meetups:
   *
   * http://localhost:3333/meetups?date=2019-07-01&page=2
   *
   * Nesse exemplo, listaremos a página 2 dos meetups que acontecerão no dia
   * 01 de Julho.
   * Nessa listagem retorne também os dados do organizador.
   */
  async index(req, res) {
    const { page = 1 } = req.query;

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'No date provided' });
    }

    const formatedDate = parseISO(date);

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(formatedDate), endOfDay(formatedDate)],
        },
      },
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
        },
      ],
    });
    return res.json(meetups);
  }

  /**
   * O usuário pode cadastrar meetups na plataforma com título do meetup,
   * descrição, localização, data e hora e imagem (banner).
   * Todos campos são obrigatórios. Adicione também um campo user_id que
   * armazena o ID do usuário que organiza o evento.
   * Não deve ser possível cadastrar meetups com datas que já passaram.
   */
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Date invalid' });
    }

    const meetup = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  /**
   * O usuário também deve poder editar todos dados de meetups que ainda
   * não aconteceram e que ele é organizador.
   */
  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    const id = req.userId;
    if (meetup.user_id !== id) {
      return res
        .status(401)
        .json({ error: 'You can only updated your meetups' });
    }

    const { date } = meetup;

    // Alternatively you can use meeup.past(returns true if is past the current hour)
    if (isBefore(date, new Date())) {
      return res.status(400).json({ error: "Can't update past meetups" });
    }

    const formatedDate = parseISO(req.body.date);

    if (isBefore(formatedDate, new Date())) {
      return res
        .status(400)
        .json({ error: "Can't update meetup date to past dates" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  /**
   * O usuário deve poder cancelar meetups organizados por ele e que ainda
   * não aconteceram. O cancelamento deve deletar o meetup da base de dados.
   */
  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    if (meetup.past) {
      return res.status(400).json({ error: "Can't delete past meetups" });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();

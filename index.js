{
  // utils

  const map = func => data => data.map(func);

  const reduce = func => init => data => data.reduce(func, init);

  const compose = (...funcs) => data => reduce((val, func) => func(val))(data)(funcs);

  const freezeIt = Object.freeze;

  const appendChild = container => child => container.appendChild(child);

  const hasClass = className => el => [...el.classList].indexOf(className) > -1;

  // model

  const updateModel = ({ model, obj }) => Object.assign({}, model, obj);

  const createModel = (model, obj) => {
    if (!obj) return Object.freeze(model);

    return compose(updateModel, freezeIt)({ model, obj });
  };

  const model = createModel({
    wines: [],
    startX: 0,
    deltaX: 0,
  });

  // update

  const actions = {
    TOUCH_START: 'TOUCH_START',
    TOUCH_MOVE: 'TOUCH_MOVE',
    TOUCH_END: 'TOUCH_END',
  };

  const handleTouchMove = (model, { x }) => {
    return updateModel({
      model,
      obj: {
        deltaX: x - model.startX,
      }
    });
  };

  const handleTouchStart = (model, { x }) => {
    return updateModel({
      model,
      obj: {
        startX: x,
      }
    });
  };

  const handleTouchEnd = (model, { x }) => {
    const pcntOffset = Math.abs(model.deltaX) / model.width * 100;
    const shouldTransition = pcntOffset > 40;

    return updateModel({
      model,
      obj: {
        currentX: null,
        deltaX: 0,
        offset: model.deltaX,
        shouldTransition,
      }
    });
  };

  const update = model => ({ action, payload }) => {
    switch (action) {
    case actions.TOUCH_START:
      return handleTouchStart(model, payload);
      break;
    case actions.TOUCH_MOVE:
      return handleTouchMove(model, payload);
      break;
    case actions.TOUCH_END:
      return handleTouchEnd(model, payload);
      break;
    default:
      throw new Error('unknown action');
    }
  };

  // view

  const createCards = wine => {
    const card = document.createElement('div');
    card.className = 'wine_card';

    return card;
  };

  const makeActive = activeIndx => (el, indx) => {
    if (activeIndx === indx) {
      el.classList.add('wine_card--active');
      el.style = 'transform: translate(7.5vw, 15vh)';
    } else {
      el.style = 'transform: translate(107.5vw, 15vh)';
    }

    return el;
  };

  const eventListener = update => action => ({ target, touches }) => {
    if (hasClass('wine_card')(target)) {
      const firstTouch = touches[0];
      const payload = {};

      if (firstTouch) {
        payload.x = firstTouch.clientX;
        payload.y = firstTouch.clientY;
      }

      return update({ action, payload });
    }
  };

  const view = (el, model, update) => {
    const doUpdate = eventListener(update);

    el.addEventListener('touchstart', doUpdate(actions.TOUCH_START));
    el.addEventListener('touchmove', doUpdate(actions.TOUCH_MOVE));
    el.addEventListener('touchend', doUpdate(actions.TOUCH_END));

    el.className = 'wine';
    el.style = 'background-color: rgba(238, 123, 111, 1);';

    compose(map(createCards), map(makeActive(0)), map(appendChild(el)))(model.wines);
  };

  const updateView = el => ({ shouldTransition, width, deltaX }) => {
    const offset = shouldTransition ? width : -deltaX;
    let style = `transform: translate(calc(7.5vw - ${offset}px), 15vh);`;

    if (shouldTransition) {
      style += ' transition: transform 100ms ease-out;';
    }

    el.querySelector('.wine_card--active').style = style;
  };

  // app

  const data = [
    {
      name: 'Barolo',
      fullName: 'Barolo di castiglione falletto',
      price: 550,
    },
    {
      name: 'Moscato',
      fullName: 'Moscato d\'asti',
      price: 550,
      desc: 'Moscato tends to be a popular white wine among wine lovers and enjoys a significant following with ' +
      'seasoned wine enthusiasts who enjoy a lighter-styled wine',
      origin: 'Asti, Italy',
      type: 'DOCG',
      alcohol: 11,
    },
  ];

  const WineApp = (model, update, view, updateView) => data => el => {
    let newModel = updateModel({
      model,
      obj: {
        wines: data,
        width: el.offsetWidth,
      }
    });

    view(el, newModel, params => {
      newModel = update(newModel)(params);
      requestAnimationFrame(() => updateView(el)(newModel));
    });
  };

  WineApp(model, update, view, updateView)(data)(document.getElementById('main'));
}
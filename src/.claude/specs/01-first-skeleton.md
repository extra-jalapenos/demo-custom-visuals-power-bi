# Goal
the visual should render if data is present. The data will be a date and a measure.
The user will get a tile chart where each column consists of seven rectangles, representing Monday to Sunday.
The rectangle's color is dependent on the measure's value: the maximum of all will be fully opaque, midpoint at 50%, missing data or close to 0 will be almost transparent.

## criteria
- the drawn rectangles are squares.
- non-present dates are still rendered as a rectangle, just blank.
- the user can set the color for the tile colors.
- the user can pick a maximum value where the tile is colored with full opacity.
- the opacity of the color is dictated by where it falls in the range of 0 to the maximum of the measure across all days.
- the y axis lists abbreviated weekday labels.
- the x Axis lists month names.
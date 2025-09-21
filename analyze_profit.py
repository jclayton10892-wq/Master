import csv, json, sys
    overhead = json.load(open(sys.argv[2])) if len(sys.argv)>2 else {"overhead_pct":0.15}
    with open(sys.argv[1]) as f:
        r=csv.DictReader(f); rows=list(r)
    for row in rows:
        labor = float(row.get('man_hours',0))*55 # rough blended rate for 3-man
        materials = float(row.get('materials_cost',0))
        overhead_cost = (labor+materials)*overhead['overhead_pct']
        price = float(row.get('price_charged',0))
        cost_total = labor+materials+overhead_cost
        profit = price - cost_total
        margin = (profit/price*100) if price>0 else 0
        print(f"{row.get('date')} {row.get('client')}: profit=${profit:.2f} margin={margin:.1f}%")
